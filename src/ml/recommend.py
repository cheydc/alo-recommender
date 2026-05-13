"""
recommend.py
------------
Accepts a user quiz profile via stdin (JSON) and returns ranked product
recommendations using cosine similarity.
"""

import json
import sys
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# ── Feature definitions ────────────────────────────────────────────────────────

WOMENS_ACTIVITIES = ["yoga", "pilates", "court sports", "train", "run", "lounge"]
MENS_ACTIVITIES   = ["train", "run", "yoga", "tennis", "recovery"]
COLORS_WOMENS     = ["black", "white", "espresso", "grey", "navy", "ivory"]
COLORS_MENS       = ["black", "espresso", "grey", "navy"]


def get_feature_lists(gender):
    """
    Returns the correct activity and color lists based on gender.
    Gender determines which feature space we encode into.
    """
    if gender == "womens":
        return WOMENS_ACTIVITIES, COLORS_WOMENS
    else:
        return MENS_ACTIVITIES, COLORS_MENS


def build_user_vector(profile, activities, colors):
    """
    Converts the user's quiz responses into a numeric feature vector.

    Multi-hot encoding for activities: a user can select multiple,
    so each selected activity gets a 1, all others get a 0.

    One-hot encoding for color: a user selects one color,
    so only that color's slot gets a 1.
    """
    vec = []

    # Multi-hot encode activities
    for activity in activities:
        vec.append(1.0 if activity in profile["activities"] else 0.0)

    # One-hot encode color
    for color in colors:
        vec.append(1.0 if color == profile["color"] else 0.0)

    return np.array(vec)


def build_product_vector(product, activities, colors):
    """
    Converts a product's attributes into the same vector space as the user.
    Both vectors must have the same structure so cosine similarity
    can compare them correctly.
    """
    vec = []

    # Multi-hot encode activities
    for activity in activities:
        vec.append(1.0 if activity in product["activities"] else 0.0)

    # One-hot encode color
    for color in colors:
        vec.append(1.0 if color == product["color"] else 0.0)

    return np.array(vec)


def recommend(profile, products, top_n=5):
    """
    Scores each product against the user profile using cosine similarity.
    Filters by gender first, then ranks by score and returns the top N.
    """
    gender = profile["gender"]
    activities, colors = get_feature_lists(gender)

    # Filter products by gender so we only score relevant items
    gender_products = [p for p in products if p["gender"] == gender]

    user_vec = build_user_vector(profile, activities, colors).reshape(1, -1)

    scored = []
    for product in gender_products:
        product_vec = build_product_vector(product, activities, colors).reshape(1, -1)
        score = cosine_similarity(user_vec, product_vec)[0][0]
        scored.append({
            "product_id": product["id"],
            "name": product["name"],
            "category": product["category"],
            "color": product["color"],
            "price": product["price"],
            "score": round(float(score), 4)
        })

    # Sort by score descending
    ranked = sorted(scored, key=lambda x: x["score"], reverse=True)

    # Assign rank positions
    for i, item in enumerate(ranked):
        item["rank"] = i + 1

    return ranked[:top_n]


if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    profile  = input_data["profile"]
    products = input_data["products"]
    top_n    = input_data.get("top_n", 5)

    results = recommend(profile, products, top_n)
    print(json.dumps(results))