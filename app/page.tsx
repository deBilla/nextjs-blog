import Link from "next/link";
import PostsPage from "./posts/page";

export default function Home() {
  return (
    <main>
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Dimuthu Wickramanayake</a>
        </div>
      </div>
      <PostsPage />
    </main>
  );
}
