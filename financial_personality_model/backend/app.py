from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from flask_cors import CORS  # ← 添加这一行

app = Flask(__name__)
CORS(app)  # ← 允许跨域请求

model = tf.keras.models.load_model("models/personality_model.h5")

def interpret_score(score):
    if score < 25:
        return "保守型", "巴菲特"
    elif score < 50:
        return "稳健型", "芒格"
    elif score < 75:
        return "进取型", "彼得·林奇"
    else:
        return "激进型", "凯西·伍德"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json.get("answers")
    if not data or len(data) != 20:
        return jsonify({"error": "请提供20个问题的答案"}), 400
    x = np.array(data).reshape(1, -1)
    pred = model.predict(x)[0][0]
    score = round(pred * 100, 2)
    personality, economist = interpret_score(score)
    return jsonify({
        "score": score,
        "personality": personality,
        "economist": economist
    })

if __name__ == "__main__":
    app.run()


