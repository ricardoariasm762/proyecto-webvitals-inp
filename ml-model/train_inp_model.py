import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as ort

np.random.seed(42)
n_samples = 3000

# 1. Generación de telemetría sintética de rendimiento web
# - long_task_duration_ms: Duración de tareas pesadas (0 a 350 ms)
long_task_duration = np.random.exponential(scale=35.0, size=n_samples)
long_task_duration = np.clip(long_task_duration, 0.0, 350.0)

# - main_thread_blocking_time_ms: Bloqueo acumulado (TBT)
blocking_time = long_task_duration * np.random.uniform(0.6, 1.4, size=n_samples)
blocking_time = np.clip(blocking_time, 0.0, 500.0)

# - dom_node_count: Nodos en el DOM (desde páginas ligeras 300 hasta complejas 4500)
dom_nodes = np.random.uniform(300, 4500, size=n_samples)

# - event_loop_lag_ms: Retraso en el ciclo de eventos (0 a 120 ms)
event_loop_lag = (blocking_time * 0.25) + np.random.normal(5.0, 4.0, size=n_samples)
event_loop_lag = np.clip(event_loop_lag, 0.5, 150.0)

# Fórmula base de INP esperado (ms) con ruido estocástico de renderizado del navegador
# Un DOM denso amplifica el coste de layout/recalc style tras una tarea pesada
dom_penalty = (dom_nodes / 1000.0) * 8.5
inp_latency = (
    16.6  # Base frame budget (60 FPS)
    + (0.75 * long_task_duration)
    + (0.45 * event_loop_lag)
    + dom_penalty
    + np.random.normal(0, 10.0, size=n_samples)
)
inp_latency = np.clip(inp_latency, 16.6, 900.0).astype(np.float32)

X = np.column_stack([
    long_task_duration.astype(np.float32),
    blocking_time.astype(np.float32),
    dom_nodes.astype(np.float32),
    event_loop_lag.astype(np.float32)
])
y = inp_latency

# 2. Entrenamiento del Modelo Regresor
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

model = RandomForestRegressor(
    n_estimators=60,
    max_depth=6,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

score_r2 = model.score(X_test, y_test)
print(f"Modelo entrenado exitosamente. R2 Score en prueba: {score_r2:.4f}")

# 3. Conversión a estándar ONNX
initial_type = [('float_input', FloatTensorType([None, 4]))]
onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=12)

output_filename = "model_inp_predictor.onnx"
with open(output_filename, "wb") as f:
    f.write(onnx_model.SerializeToString())

print(f"Archivo exportado: {output_filename}")

# 4. Verificación de Inferencia con ONNX Runtime
session = ort.InferenceSession(output_filename)
input_name = session.get_inputs()[0].name

# Vector de prueba: [long_task: 120ms, blocking: 95ms, dom_nodes: 2500, lag: 45ms]
test_vector = np.array([[120.0, 95.0, 2500.0, 45.0]], dtype=np.float32)
prediction = session.run(None, {input_name: test_vector})[0]

print(f"Prueba de inferencia exitosa -> INP estimado: {prediction[0][0]:.2f} ms")