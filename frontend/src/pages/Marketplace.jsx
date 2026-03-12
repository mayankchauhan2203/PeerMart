function Marketplace() {

  const items = [
    { id: 1, name: "Cycle", price: "₹2500", seller: "Kumaon Hostel" },
    { id: 2, name: "Mattress", price: "₹800", seller: "Aravali Hostel" },
    { id: 3, name: "Calculator", price: "₹600", seller: "Satpura Hostel" },
    { id: 4, name: "Study Table", price: "₹1200", seller: "Udaigiri Hostel" }
  ];

  return (
    <div style={{padding:"20px"}}>
      <h1>Marketplace</h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))",
        gap:"20px",
        marginTop:"20px"
      }}>

        {items.map(item => (
          <div key={item.id} style={{
            border:"1px solid #ddd",
            borderRadius:"10px",
            padding:"15px",
            boxShadow:"0 2px 5px rgba(0,0,0,0.1)"
          }}>

            <div style={{
              height:"120px",
              background:"#eee",
              marginBottom:"10px"
            }} />

            <h3>{item.name}</h3>
            <p>{item.price}</p>
            <p style={{fontSize:"14px", color:"gray"}}>{item.seller}</p>

          </div>
        ))}

      </div>
    </div>
  );
}

export default Marketplace;