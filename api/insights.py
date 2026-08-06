import json
import os
import sys
from http.server import BaseHTTPRequestHandler
import pandas as pd
import numpy as np

def sanitize_value(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        return float(val)
    if isinstance(val, (np.ndarray, list)):
        return [sanitize_value(v) for v in val]
    if isinstance(val, dict):
        return {k: sanitize_value(v) for k, v in val.items()}
    return str(val)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            if not body:
                self.send_error_response("Empty request body")
                return

            try:
                payload = json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_error_response("Invalid JSON payload")
                return

            analysis_type = payload.get('type')
            data = payload.get('data')

            if not data or not isinstance(data, list):
                self.send_error_response("Missing or invalid 'data' parameter (must be a non-empty list of rows)")
                return

            if analysis_type == 'trend':
                self.handle_trend(payload, data)
            elif analysis_type == 'outlier':
                self.handle_outlier(payload, data)
            elif analysis_type == 'correlation':
                self.handle_correlation(payload, data)
            else:
                self.send_error_response(f"Unsupported or missing analysis type: '{analysis_type}'")

        except Exception as e:
            self.send_error_response(f"Internal server error: {str(e)}")

    def send_error_response(self, message):
        self.send_response(400)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        response = {"status": "error", "error": message}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def send_success_response(self, result):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        response = {"status": "success", "result": result}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_trend(self, payload, data):
        date_col = payload.get('date_column')
        metric_col = payload.get('metric_column')

        if not date_col or not metric_col:
            self.send_error_response("Trend forecasting requires 'date_column' and 'metric_column' parameters")
            return

        # Check if columns are in dataset
        first_row = data[0]
        if date_col not in first_row or metric_col not in first_row:
            self.send_error_response(f"Specified columns '{date_col}' or '{metric_col}' not found in the dataset")
            return

        df = pd.DataFrame(data)

        # Parse metric column as float
        df[metric_col] = pd.to_numeric(df[metric_col], errors='coerce')

        # Parse date column for chronological sorting
        df['__parsed_date__'] = pd.to_datetime(df[date_col], errors='coerce')

        # Clean: drop missing dates or metrics
        df = df.dropna(subset=['__parsed_date__', metric_col])

        if len(df) < 2:
            self.send_error_response("Insufficient data points for trend analysis (minimum 2 valid date-metric pairs required)")
            return

        # Sort chronologically
        df = df.sort_values(by='__parsed_date__')

        # Sequential integers for x axis of fit
        x = np.arange(len(df))
        y = df[metric_col].values.astype(float)

        # Fit linear regression
        slope, intercept = np.polyfit(x, y, 1)

        # Determine direction
        if slope > 0.001:
            direction = "increasing"
        elif slope < -0.001:
            direction = "decreasing"
        else:
            direction = "flat"

        # Projection for next period
        next_period_idx = len(df)
        projection = float(slope * next_period_idx + intercept)

        # Construct trend line points
        points = []
        for idx, (_, row) in enumerate(df.iterrows()):
            points.append({
                "date": str(row[date_col]),
                "actual": float(row[metric_col]),
                "trend": float(slope * idx + intercept)
            })

        result = {
            "direction": direction,
            "slope": float(slope),
            "intercept": float(intercept),
            "projection": projection,
            "points": points
        }
        self.send_success_response(result)

    def handle_outlier(self, payload, data):
        metric_col = payload.get('metric_column')

        if not metric_col:
            self.send_error_response("Outlier detection requires 'metric_column' parameter")
            return

        first_row = data[0]
        if metric_col not in first_row:
            self.send_error_response(f"Specified metric column '{metric_col}' not found in the dataset")
            return

        df = pd.DataFrame(data)
        df[metric_col] = pd.to_numeric(df[metric_col], errors='coerce')
        df_clean = df.dropna(subset=[metric_col])

        if len(df_clean) == 0:
            self.send_error_response("No valid numeric values in column to perform outlier detection")
            return

        vals = df_clean[metric_col]
        q1 = float(vals.quantile(0.25))
        q3 = float(vals.quantile(0.75))
        iqr = q3 - q1
        lower_bound = float(q1 - 1.5 * iqr)
        upper_bound = float(q3 + 1.5 * iqr)

        # Flag outliers
        points = []
        outlier_count = 0
        for idx, row in df.iterrows():
            row_dict = {k: sanitize_value(v) for k, v in row.items()}
            val = row_dict.get(metric_col)

            if val is None:
                row_dict["is_outlier"] = False
                points.append(row_dict)
                continue

            val_float = float(val)
            is_outlier = bool(val_float < lower_bound or val_float > upper_bound)
            if is_outlier:
                outlier_count += 1
            row_dict["is_outlier"] = is_outlier
            points.append(row_dict)

        result = {
            "bounds": {
                "q1": float(q1),
                "q3": float(q3),
                "iqr": float(iqr),
                "lower_bound": float(lower_bound),
                "upper_bound": float(upper_bound)
            },
            "summary": {
                "total_points": int(len(df_clean)),
                "outlier_count": int(outlier_count)
            },
            "points": points
        }
        self.send_success_response(result)

    def handle_correlation(self, payload, data):
        numeric_cols = payload.get('numeric_columns')

        if not numeric_cols or not isinstance(numeric_cols, list):
            self.send_error_response("Correlation analysis requires a non-empty list of 'numeric_columns'")
            return

        # Check column existence
        first_row = data[0]
        valid_cols = [col for col in numeric_cols if col in first_row]

        if len(valid_cols) < 2:
            self.send_error_response("Not enough numeric columns for correlation analysis (minimum 2 valid numeric columns required)")
            return

        df = pd.DataFrame(data)
        for col in valid_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # Drop rows where all of the target columns are NaN
        df = df.dropna(subset=valid_cols, how='all')

        if len(df) < 2:
            self.send_error_response("Insufficient rows with numeric data to perform correlation analysis (minimum 2 rows required)")
            return

        corr_matrix = df[valid_cols].corr()
        # Handle division-by-zero/NaN correlation values
        corr_matrix = corr_matrix.fillna(0.0)

        # Convert to JSON serializable dictionary
        matrix_dict = {}
        for col in corr_matrix.columns:
            matrix_dict[col] = {k: float(v) for k, v in corr_matrix[col].to_dict().items()}

        # Find strongest positive and negative correlations
        strongest_pos = None
        strongest_neg = None
        max_pos_val = 0.0
        min_neg_val = 0.0

        cols = list(corr_matrix.columns)
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                col1 = cols[i]
                col2 = cols[j]
                val = corr_matrix.loc[col1, col2]
                if pd.isna(val):
                    continue

                if val > max_pos_val:
                    max_pos_val = val
                    strongest_pos = (col1, col2, val)
                if val < min_neg_val:
                    min_neg_val = val
                    strongest_neg = (col1, col2, val)

        summary_parts = []
        if strongest_pos and max_pos_val >= 0.1:
            col1, col2, val = strongest_pos
            strength = "strong" if val >= 0.7 else "moderate" if val >= 0.4 else "weak"
            summary_parts.append(f"'{col1}' and '{col2}' show a {strength} positive correlation ({val:.2f}).")
        else:
            summary_parts.append("No positive correlations were found between numeric columns.")

        if strongest_neg and min_neg_val <= -0.1:
            col1, col2, val = strongest_neg
            strength = "strong" if val <= -0.7 else "moderate" if val <= -0.4 else "weak"
            summary_parts.append(f"'{col1}' and '{col2}' show a {strength} negative correlation ({val:.2f}).")
        else:
            summary_parts.append("No negative correlations were found between numeric columns.")

        plain_summary = " ".join(summary_parts)

        result = {
            "matrix": matrix_dict,
            "plain_summary": plain_summary,
            "strongest_positive": {
                "columns": [strongest_pos[0], strongest_pos[1]] if strongest_pos else None,
                "coefficient": float(strongest_pos[2]) if strongest_pos else None
            },
            "strongest_negative": {
                "columns": [strongest_neg[0], strongest_neg[1]] if strongest_neg else None,
                "coefficient": float(strongest_neg[2]) if strongest_neg else None
            }
        }
        self.send_success_response(result)

if __name__ == '__main__':
    # Direct terminal / child process CLI support
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)
        analysis_type = payload.get('type')
        data = payload.get('data')

        class CommandHandler(handler):
            def __init__(self):
                pass
            def send_error_response(self, message):
                print(json.dumps({"status": "error", "error": message}))
                sys.exit(0)
            def send_success_response(self, result):
                print(json.dumps({"status": "success", "result": result}))
                sys.exit(0)

        h = CommandHandler()
        if analysis_type == 'trend':
            h.handle_trend(payload, data)
        elif analysis_type == 'outlier':
            h.handle_outlier(payload, data)
        elif analysis_type == 'correlation':
            h.handle_correlation(payload, data)
        else:
            h.send_error_response(f"Unsupported analysis type: {analysis_type}")
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)
