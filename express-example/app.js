const express    = require("express");
const logger     = require("morgan");
const bodyParser = require("body-parser");
const fs         = require("fs");
const config     = require("./config.js");
const alipayf2f  = require("../");
const app        = express();

const SERVICE_PORT = 3000;

app.use(require("compression")());
app.engine(".ejs", require("ejs").__express);
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use((req, res, next) => {
	req.config    = config;
	req.alipayf2f = new alipayf2f(config);


	/* 模拟数据库 仅仅作为演示 */
	req.database  = {
		get(id) {
			return new Promise((resolve, reject) => {
				if(!fs.existsSync(`./fs-database/${id}.json`)) {
					return resolve(null);
				}
				fs.readFile(`./fs-database/${id}.json`, function (err, data) {
					if (err) return (reject);
					resolve(JSON.parse(data.toString()));
				});
			});
		},

		delete(id) {
			return new Promise((resolve, reject) => {
				if(!fs.existsSync(`./fs-database/${id}.json`)) {
					return resolve();
				}
				fs.unlink((`./fs-database/${id}.json`, function (err) {
					resolve(data);
				}));
			});
		},

		insert(id, obj) {
			return new Promise((resolve, reject) => {
				if(fs.existsSync(`./fs-database/${id}.json`)) {
					return resolve(false);
				}
				fs.writeFile(`./fs-database/${id}.json`, JSON.stringify(obj), function(err){
					if(err) return reject(err);
					resolve(true);
				});
			});
		},

		update(id, obj) {
			return new Promise((resolve, reject) => {
				fs.writeFile(`./fs-database/${id}.json`, JSON.stringify(obj), function(err){
					if(err) return reject(err);
					resolve(true);
				});
			});
		},
	};
	res.error     = (result) => res.json({ "status": false, message: result });
	res.success   = (result) => res.json({ "status": true, message: result });
	res.catch     = (error) => {
		console.error(error);
		res.json({ "status": false, "message": "服务器错误, 请稍后重试。" }).end();
	};
	next();
});



app.use("/", require("./controllers/index"));

app.use((req, res) => res.status(404).send("页面未找到."));

process.on("uncaughtException", (err) => console.trace(err));

app.listen(SERVICE_PORT, (error) => {
	if (error) {
		return console.error("Listening error:", error);
	}
	console.log("Listening port:", SERVICE_PORT);
});