import React from 'react'

export type Post = {
  userId: number,
  id: number,
  title: string,
  body: string
}

const PostPage = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {cache: 'no-cache'});
  const posts: Post[] = await res.json();
  return (
    <div>
      <h1>Post Page</h1>
      <h2>{new Date().toLocaleTimeString()}</h2>
      {
        posts.map((post) => {
          return <li key={post.id}>{post.title}</li>
        })
      }
    </div>
  )
}

export default PostPage;
