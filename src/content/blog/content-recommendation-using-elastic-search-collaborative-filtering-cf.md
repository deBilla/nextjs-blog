---
title: "Content Recommendation Using Elastic Search — Collaborative Filtering (CF)"
date: "2024-07-24"
preview: "Hi Guys, In my last article I looked in to how we can create a content based recommendation system (TF-IDF) using Elastic search."
description: "Building a collaborative filtering recommendation system on Elasticsearch, following an earlier content-based TF-IDF approach."
tags: ["aws", "nodejs", "ai"]
mediumUrl: "https://medium.com/@billacode/content-recommendation-using-elastic-search-collaborative-filtering-cf-38b1a03b85c7"
---
Hi Guys, In my last article I looked in to how we can create a content based recommendation system (TF-IDF) using Elastic search.

Now in this article I will be trying to create a recommendation system using Collaborative filtering.

Collaborative filtering models use the collaborative power of ratings provided by multiple users to make recommendations. The basic idea is that unspecified ratings can be computed because observed ratings are often highly correlated across various users and items. There are two main types of collaborative filtering.

- **User-Based **— Finding similar users and recommending items based on their preferences. (UBCF)
- **Item-Based** — Recommends items similar to those a user has already interacted with. (IBCF)

So as the first step I will focus on creating a item based CF model. It’s being said that this IBCF method was introduced by Amazon back in 1998 and this was one of the main reason behind their success.

I will be using an example scenario where we keep media data set in Elastic Search and User rating data in a Postgres table. I will be using Python 3.11 with libraries for Postgres and Elastic search.

Now to implement IBCF on this, first we need to identify media, users have already interacted (rated). Then we need a list of media titles from Elastic search.

```
pip3 install elastic_enterprise_search
pip3 install psycopg2-binary
```

Now let’s use these libraries to get Rating data and Elastic search media documents.

```javascript
from elastic_enterprise_search import AppSearch
import psycopg2
```

```
# Connect to PostgreSQL
conn = psycopg2.connect(
    host=<HOST>,
    database=<DATABASE>,
    user=<USER>,
    password=<PASSWORD>
)
cursor = conn.cursor()
```

```
# Connect to Elasticsearch
app_search = AppSearch(<HOST>, http_auth=<API_KEY>)
```

```
# Step 1: Retrieve User Ratings from PostgreSQL
cursor.execute("SELECT user_id, media_id, rating FROM user_rating LIMIT 100")
ratings_data = cursor.fetchall()
```

```
# Step 2: Fetch Media Documents from Elasticsearch
media_uuids = [row[1] for row in ratings_data]
media_documents = app_search.get_documents(engine_name=<ENGINE_NAME>, document_ids=media_uuids)
```

Now we have our rating data which contains user_id, media_id and rating and also we have a set of media documents from Elastic Search. Now the media_id maps to the document id of Elastic Search. As the next step I will create a user movie matrix with ratings.

```
user_movie_matrix = {}
for user, movie, rating in ratings_data:
    user_movie_matrix.setdefault(user, {})[movie] = rating
```

Now I will use this matrix to create a np array. After creating the array I will replace undefined Null values with 0s.

```
matrix_array = np.array([[user_movie_matrix.get(user, {}).get(movie, 0) for movie in sorted(media_uuids)] for user in user_movie_matrix])
matrix_array[matrix_array == None] = 0  # Replace None with 0
```

Now we have an array of all the media items with user ratings. Now we should focus on the target users already rated data.

```
user_id = <USER_ID>  # Example user ID
cursor.execute("SELECT media_id, rating FROM user_rating WHERE user_id = %s", (user_id,))
user_ratings_data = cursor.fetchall()
```

```
user_ratings = {media_id: rating for media_id, rating in user_ratings_data}
```

Now let’s create a np array of this as well.

```
target_user_ratings_array = np.array([user_ratings.get(media_id, 0) for media_id in media_uuids])
```

```
target_user_ratings_array[target_user_ratings_array == None] = 0  # Replace None with 0
```

Now with this `target_user_ratings_array` let’s get cosine similarity for all the media. The reason to take the cosine similarity is, we need the least distance between 2 records similarity wise.

```
# Calculate similarity between target user's ratings and all items
similarity_scores = cosine_similarity([target_user_ratings_array], matrix_array)[0]
```

Now we have the similar items, now let’s sort it.

```
# Sort items based on similarity scores (higher scores mean more similar)
sorted_indices = np.argsort(similarity_scores)[::-1]  # Sort in descending order
```

Ok, now we can print the top 3 items in the sorted array.

```
# Get top N recommended items (e.g., top 3 recommendations)
top_n = 3
recommended_items = [sorted_indices[i] for i in range(top_n)]
```

```
print("Top recommended items for the target user")
for idx in recommended_items:
    print(media_uuids[idx])
```

So this is the whole implementation for the collaborative filtering implementation with python and elastic search. If you have any questions please post it as comments. Thanks guys !!!

Happy Coding !!! :P
