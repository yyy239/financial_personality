import numpy as np
from keras.models import Sequential
from keras.layers import Dense, Dropout, BatchNormalization
from keras.callbacks import EarlyStopping
import matplotlib.pyplot as plt
import os

# 问卷问题方向：+1 为激进倾向，-1 为保守倾向
directions = np.array([
    -1, +1, -1, +1, +1, +1, -1, -1, +1, +1,
    -1, +1, -1, +1, +1, -1, -1, +1, +1, -1
])

# 非线性打分函数，加入多个交叉项
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
        + 0.5 * interaction1
        + 0.5 * interaction2
        + 0.4 * interaction3
        + 0.4 * interaction4
        + 0.4 * interaction5
        - 0.3 * interaction6
        - 0.3 * interaction7
        + 0.4 * interaction8
        - 0.4 * suppression
    )

    score = np.tanh(raw_score / 15)
    score = (score + 1) / 2 * 100
    return score

# 改进的数据生成函数
def generate_data(samples=100000, noise_std=5):
    # 生成答题矩阵，每题 1~5 分
    X = np.random.randint(1, 6, size=(samples, 20))

    # 获取打分（0~100之间）
    y_clean = semantic_score(X)

    # 加入高斯噪声，模拟真实世界偏差
    noise = np.random.normal(loc=0, scale=noise_std, size=samples)
    y_noisy = y_clean + noise

    # 裁剪到合法区间 [0, 100]
    y_final = np.clip(y_noisy, 0, 100)

    return X, y_final

X, y = generate_data()

# 模型构建（加入 Dropout + BatchNorm）
model = Sequential([
    Dense(128, activation='relu', input_shape=(20,)),
    BatchNormalization(),
    Dropout(0.3),

    Dense(64, activation='relu'),
    BatchNormalization(),
    Dropout(0.2),

    Dense(32, activation='relu'),
    BatchNormalization(),
    Dropout(0.2),

    Dense(1, activation='sigmoid')  # 回归输出（0~1）
])

model.compile(loss='mse', optimizer='adam', metrics=['mae'])

# 模型训练
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
history = model.fit(X, y / 100.0, epochs=100, batch_size=32, validation_split=0.2, callbacks=[early_stop])

# 保存模型和可视化图像
os.makedirs("models", exist_ok=True)
model.save("models/personality_model.h5")

plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Training vs Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.savefig("models/loss_curve.png")
plt.close()

