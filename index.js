import http from "http";

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
    if (req.method === "POST" && req.url === "/users") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const newUser = JSON.parse(body);
            userData.push(newUser);
            res.writeHead(201, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(newUser));
        });
    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Not found" }));
    }
});

server.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});
