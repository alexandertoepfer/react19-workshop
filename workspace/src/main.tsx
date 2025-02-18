import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./create-query-client.ts";
import PostPage from "./PostPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { element: <App />, index: true },
      { path: "posts/:postId", element: <PostPage /> }
    ]
  }
]);

function addLinkToHead(href: string, rel: string = "stylesheet"): void {
  const linkElement = document.createElement("link");
  linkElement.rel = rel;
  linkElement.href = href;
  document.head.appendChild(linkElement);
}

addLinkToHead(
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
);
addLinkToHead(
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
);

console.log("ROUTER", router);
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
