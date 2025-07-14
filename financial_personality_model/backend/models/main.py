import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping
import matplotlib.pyplot as plt
import os

# 问卷问题方向
directions = np.array([
    -1, +1, -1, +1, +1, +1, -1, -1, +1, +1,
    -1, +1, -1, +1, +1, -1, -1, +1, +1, -1
])

# 打分函数
def semantic_score(X):
    base = X @ directions.T
    interaction1 = X[:, 4] * X[:, 5]
    interaction2 = X[:, 3] * X[:, 9]
    interaction3 = X[:, 1] * X[:, 4]
    interaction4 = X[:, 14] * X[:, 18]
    suppression = X[:, 2] * X[:, 7]
    interaction5 = X[:, 5] * X[:, 10]
    interaction6 = X[:, 2] * X[:, 10]
    interaction7 = X[:, 6] * X[:, 15]
    interaction8 = X[:, 0] * X[:, 11]

    raw_score = (
    base
    + 0.2 * interaction1
    + 0.2 * interaction2
    + 0.15 * interaction3
    + 0.15 * interaction4
    + 0.15 * interaction5
    - 0.1 * interaction6
    - 0.1 * interaction7
    + 0.15 * interaction8
    - 0.15 * suppression
)


    score = np.tanh(raw_score / 15)
    score = (score + 1) / 2 * 100
    return score

# 数据生成
def generate_data(samples=100000, noise_std=5):
    X = np.random.randint(1, 6, size=(samples, 20))
    y_clean = semantic_score(X)
    noise = np.random.normal(loc=0, scale=noise_std, size=samples)
    y_noisy = y_clean + noise
    y_final = np.clip(y_noisy, 0, 100)
    return X, y_final

X, y = generate_data()

# 显式添加 Input 层
model = Sequential([
    Input(shape=(20,)),  # ← 显式定义输入层，兼容部署
    Dense(128, activation='relu'),
    BatchNormalization(),
    Dropout(0.3),

    Dense(64, activation='relu'),
    BatchNormalization(),
    Dropout(0.2),

    Dense(32, activation='relu'),
    BatchNormalization(),
    Dropout(0.2),

    Dense(1, activation='sigmoid')  # 输出：归一化分数
])

model.compile(loss='mse', optimizer='adam', metrics=['mae'])

# 提前终止策略
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
history = model.fit(X, y / 100.0, epochs=100, batch_size=32, validation_split=0.2, callbacks=[early_stop])

# 保存为 h5 格式，适配 Render
os.makedirs("models", exist_ok=True)
model.save("models/personality_model.h5")

# 可视化训练曲线
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Training vs Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.savefig("models/loss_curve.png")
plt.close()

