from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from flask_cors import CORS
import os

app = Flask(__name__)

# 精确配置 CORS（替换为你的前端域名）
CORS(app, resources={
    r"/predict": {
        "origins": ["https://financial-personality.vercel.app"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# 全局变量用于缓存模型（避免重复加载）
model = None

def load_model_once():
    """延迟加载模型，减少启动内存压力"""
    global model
    if model is None:
        model = tf.keras.models.load_model("models/personality_model.h5")
    return model

def interpret_score(score):
    if score < 25:
        return "保守型", "巴菲特"
    elif score < 50:
        return "稳健型", "芒格"
    elif score < 75:
        return "进取型", "彼得·林奇"
    else:
        return "激进型", "凯西·伍德"

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        # 直接返回 CORS 预检请求响应
        return jsonify({"status": "ok"}), 200, {
            "Access-Control-Allow-Origin": "https://financial-personality.vercel.app",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }

    try:
        data = request.json.get("answers")
        if not data or len(data) != 20:
            return jsonify({"error": "请提供20个问题的答案"}), 400

        # 延迟加载模型
        model = load_model_once()
        x = np.array(data).reshape(1, -1)
        pred = model.predict(x, verbose=0)[0][0]  # 关闭TensorFlow冗余日志
        score = round(pred * 100, 2)
        personality, economist = interpret_score(score)

        return jsonify({
            "score": score,
            "personality": personality,
            "economist": economist
        }), 200, {
            "Access-Control-Allow-Origin": "https://financial-personality.vercel.app"
        }

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, threaded=True)  # 启用多线程

