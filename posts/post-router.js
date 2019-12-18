const express = require("express")
const db = require("../data/db-config") // database access using knex

const router = express.Router()

router.get("/", async (req, res, next) => {
	try {
		// translates to `SELECT * FROM posts`
		res.json(await db("posts").select())
		
		// the above is shorthand for this, which looks closer to raw SQL:
		// res.json(await db.select("*").from("posts"))
	} catch (err) {
		next(err)
	}
})

router.get("/:id", validatePostId, async (req, res, next) => {
	try {
		// translates to `SELECT * FROM posts WHERE id = ? LIMIT 1;`
		// since all select statements can return multiple values (in an array),
		// calling .first instead of .select will take out the first result in the array
		// (if we know there will only be one item)
		res.json(await db("posts").where("id", req.params.id).first())
	} catch (err) {
		next(err)
	}
})

router.post("/", async (req, res, next) => {
	try {
		const payload = {
			// these object keys should match up to the column names
			title: req.body.title,
			contents: req.body.contents,
		}

		// translates to `INSERT INTO posts (title, contents) VALUES(?, ?);`
		// .insert returns an array of IDs for the new rows, so we just destructure it
		const [id] = await db("posts").insert(payload)
		res.json(await db("posts").where("id", id).first())
	} catch (err) {
		next(err)
	}
})

router.put("/:id", validatePostId, async (req, res, next) => {
	try {
		const payload = {
			// these object keys should match up to the column names
			title: req.body.title,
			contents: req.body.contents,
		}

		// translates to `UPDATE posts SET title = ? AND contents = ? WHERE id = ?;`
		await db("posts").where("id", req.params.id).update(payload)
		// Refetch the post from the DB since it was updated
		res.json(await db("posts").where("id", req.params.id).first())
	} catch (err) {
		next(err)
	}
})

router.delete("/:id", validatePostId, async (req, res, next) => {
	try {
		// translates to `DELETE FROM posts WHERE id = ?;`
		// Don't forget your .where or you'll delete EVERYTHING in your database :/
		await db("posts").where("id", req.params.id).del()
		res.status(204).end()
	} catch (err) {
		next(err)
	}
})

// Some simple middleware to validate the post ID before trying to use it
async function validatePostId(req, res, next) {
	try {
		const post = await db("posts").where("id", req.params.id).first()
		if (post) {
			next()
		} else {
			res.status(404).json({ message: "Post not fonud" })
		}
	} catch (err) {
		next(err)
	}
}

module.exports = router
