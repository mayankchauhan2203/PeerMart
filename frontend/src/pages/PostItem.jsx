import { useState } from "react";

function PostItem() {

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const newItem = {
      title,
      price,
      description
    };

    console.log("New item posted:", newItem);

    alert("Item submitted!");

    setTitle("");
    setPrice("");
    setDescription("");
  }

  return (
    <div style={{padding:"20px"}}>
      <h1>Post an Item</h1>

      <form onSubmit={handleSubmit} style={{
        display:"flex",
        flexDirection:"column",
        gap:"15px",
        maxWidth:"400px"
      }}>

        <input
          type="text"
          placeholder="Item title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e)=>setPrice(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <button type="submit">Submit Item</button>

      </form>
    </div>
  );
}

export default PostItem;