const API_URL = `http://workshop-alb-330242433.us-east-1.elb.amazonaws.com/`

async function API_CALL(){
    try{
        const response = await fetch(`${API_URL}/uploadMessage`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: 0,
                action: "upload",
                message: "ANOTHER MESSAGE",
        })});
    } catch (error){
        console.log(error.message);
    }
}
function test(concurrent, durationSeconds){
    const end = Date.now() + durationSeconds * 1000;
    while (Date.now() < end)
        for (let i = 0; i < concurrent; i++)
            API_CALL();
}
test(100, 90);