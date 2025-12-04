from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from wordcloud import WordCloud
import io, os, base64
import requests  

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), '..', 'templates'))
CORS(app)  

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/wordcloud', methods=['POST'])
def generate_wordcloud():
    try:
        data_json = request.get_json()
        data_list = data_json.get('data', [])
        
        if not data_list:
            return jsonify({'error': 'No data provided'}), 400
        
       
        text = " ".join(item.get('rawComment', '') for item in data_list)
        
        if not text.strip():
            return jsonify({'error': 'No valid comments to generate word cloud'}), 400
        
        
        wordcloud = WordCloud(
            width=1200,
            height=400,
            background_color='white',
            colormap='inferno',
            max_words=100,
            relative_scaling=0.5,
            min_font_size=10
        ).generate(text)
        
        
        img_bytes = io.BytesIO()
        wordcloud.to_image().save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
       
        img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloud-generate', methods=['GET'])
def generate_cloud_from_external():
    try:
        
        res = requests.get("https://lok-vaani-1.onrender.com/api/v1/comments/cloud-comment")
        res.raise_for_status()
        data_json = res.json()

        
        comments = data_json.get("data", [])

        if not comments:
            return jsonify({"error": "No comments found in API"}), 400

       
        text = " ".join(str(comment) for comment in comments)

        if not text.strip():
            return jsonify({"error": "No valid comments to generate cloud"}), 400

       
        wordcloud = WordCloud(
            width=1200,
            height=400,
            background_color='white',
            colormap='inferno',
            max_words=200,
            relative_scaling=0.5,
            min_font_size=10
        ).generate(text)

        
        img_bytes = io.BytesIO()
        wordcloud.to_image().save(img_bytes, format='PNG')
        img_bytes.seek(0)

        img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')

        return jsonify({
            "success": True,
            "image": f"data:image/png;base64,{img_base64}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True, port=5000)
