from flask import Flask, render_template, jsonify, request
from database import get_db_connection, init_db
from datetime import datetime

app = Flask(__name__)

init_db()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()

    categories = conn.execute(
        "SELECT * FROM categories"
    ).fetchall()

    conn.close()

    return jsonify([dict(row) for row in categories])


@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    conn = get_db_connection()

    query = """
        SELECT expenses.id,
               expenses.title,
               expenses.amount,
               expenses.date,
               expenses.description,
               expenses.category_id,
               categories.name AS category
        FROM expenses
        JOIN categories
        ON expenses.category_id = categories.id
        ORDER BY expenses.date DESC
    """

    expenses = conn.execute(query).fetchall()

    conn.close()

    return jsonify([dict(row) for row in expenses])


@app.route("/api/expenses", methods=["POST"])
def add_expense():
    data = request.json

    title = data.get("title")
    amount = data.get("amount")
    category_id = data.get("category_id")
    date = data.get(
        "date",
        datetime.today().strftime("%Y-%m-%d")
    )
    description = data.get("description", "")

    if not title or amount is None or not category_id or not date:
        return jsonify({
            "error": "Missing required fields"
        }), 400

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO expenses
        (title, amount, category_id, date, description)
        VALUES (?, ?, ?, ?, ?)
        """,
        (title, amount, category_id, date, description)
    )

    conn.commit()

    new_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "message": "Expense added successfully",
        "id": new_id
    }), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    data = request.json

    title = data.get("title")
    amount = data.get("amount")
    category_id = data.get("category_id")
    date = data.get("date")
    description = data.get("description", "")

    if not title or amount is None or not category_id or not date:
        return jsonify({
            "error": "Missing required fields"
        }), 400

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE expenses
        SET title = ?,
            amount = ?,
            category_id = ?,
            date = ?,
            description = ?
        WHERE id = ?
        """,
        (
            title,
            amount,
            category_id,
            date,
            description,
            expense_id
        )
    )

    conn.commit()

    updated = cursor.rowcount

    conn.close()

    if updated == 0:
        return jsonify({
            "error": "Expense not found"
        }), 404

    return jsonify({
        "message": "Expense updated successfully"
    })


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_db_connection()

    conn.execute(
        "DELETE FROM expenses WHERE id = ?",
        (expense_id,)
    )

    conn.commit()

    conn.close()

    return jsonify({
        "message": "Expense deleted successfully"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)