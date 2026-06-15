import http from "http";

const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("Hello, World!");
    } else if (req.method === "GET" && req.url === "/about") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("This is the about page.");
    } else if (req.method === "POST" && req.url === "/submit") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("Data submitted successfully!");
        });
    }
    else if (req.method === "GET" && req.url === "/contact") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("This is the contact page.");
    }
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not Found");
    }
});

server.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});
