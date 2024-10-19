import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import NewsAPI from "newsapi";
import dotenv from "dotenv";

dotenv.config(); 

const API_KEY = process.env.API_KEY;


const newsapi = new NewsAPI(API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", async (req, res)=>{
   console.log(req.body);
 try{
    const response = await axios.get(`https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=${API_KEY}`);
    const result = response.data;
    res.render("index" , {articles: result.articles}) ;
    console.log(result.articles);
 }
 catch(error){
    console.log(error);
 }
});

app.post('/filter' , async (req ,res) =>{
    const {country, source, q, category, language } = req.body;
    const params = {
      source:source,
      q: q,
      language: language,
      
      
   };
   console.log(req.body);
  try{
   
    const response = await newsapi.v2.everything(params);
    
    const {articles=[]} =response;
    res.render("filtered" , {articles}) ;
   
    
  }
  catch(error){
    console.log(error);
  }




});






app.listen(port ,() => {
    console.log(`Server running at http://localhost:${port}`);
});
