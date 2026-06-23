import http from "http";
import EventEmitter from "events";
import fs from "fs";

const eventEmitter = new EventEmitter();

eventEmitter.on("userCreated", (user) => {
    console.log(`User created: ${user.name}`);
});

eventEmitter.on("userDeleted", (userId) => {
    console.log(`User deleted with id: ${userId}`);
});

eventEmitter.on("fileDownloaded", (fileName) => {
    console.log(`File downloaded: ${fileName}`);
});
const userData = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" },
    { id: 3, name: "Alice Smith" },
    { id: 4, name: "Bob Johnson" },
    { id: 5, name: "Charlie Brown" },
];

const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(userData));
    }

    if (req.method === "GET" && req.url.startsWith("/users/")) {
        const userId = parseInt(req.url.split("/")[2], 10);
        const user = userData.find((u) => u.id === userId);
        if (user) {
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(user));
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "User not found" }));
        }
    }
    if (req.method === "POST" && req.url === "/submit") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const newUser = JSON.parse(body);
            userData.push(newUser);
            eventEmitter.emit("userCreated", newUser);
            res.writeHead(201, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(newUser));
        });
        return;
    }

    if (req.method === "GET" && req.url === "/download") {
        const filePath = fs.createReadStream(
            "C:\\Users\\V2\\Downloads\\Node_HTTP_Server_PRD.docx",
        );
        res.writeHead(200, { "Content-Type": "application/octet-stream" });
        filePath.pipe(res).on("finish", () => {
            eventEmitter.emit("fileDownloaded", "Node_HTTP_Server_PRD.docx");
        });

        filePath.on("error", (err) => {
            console.error("Error reading file:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        });

        return;
    }

    if (req.method === "DELETE" && req.url.startsWith("/delete")) {
        const userId = parseInt(req.url.split("/")[2], 10);
        const userIndex = userData.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
            const deletedUser = userData.splice(userIndex, 1)[0];
            eventEmitter.emit("userDeleted", deletedUser.id);
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({ message: `User with id ${userId} deleted` }),
            );
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "User not found" }));
        }
    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Not found" }));
    }
});

server.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});
