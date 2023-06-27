const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname+"/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true, useUnifiedTopology:true});

app.set("view engine","ejs");

const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Welcome to our todolist"
});
const item2 = new Item({
    name:"Hit + to save item"
});
const item3 = new Item({
    name:"Click checkbox to delete item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List",listSchema);

app.get("/",function(req, res){
    const day = date.getFullDate();
    Item.find({},function(err, foundItems){
        if(foundItems.length===0){
            Item.insertMany(defaultItems,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully saved the default items");
                }
            });
            res.redirect("/");
        }else{
            res.render("index",{listType:day, listOfItems: foundItems});
        }
    });
});

app.get("/:customList", function(req,res){
  const customList = _.capitalize(req.params.customList);
  List.findOne({name: customList},function(err, foundList){
    if(!foundList){
        const list = new List({
            name: customList,
            items: defaultItems
        });
        list.save();
        res.redirect("/"+ customList);
        }else{
            res.render("index",{listType:foundList.name, listOfItems: foundList.items});
        }
    });
});

app.post("/", function(req,res){
    const listName=req.body.button;
    const itemName=req.body.newItem;
    const item = new Item({
        name: itemName
    });
    if(listName==="Monday,"||listName==="Tuesday,"||listName==="Wesnesday,"||listName==="Thursday,"||listName==="Friday,"||listName==="Saturday,"||listName==="Sunday,"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
        });
        res.redirect("/"+listName);
    }     
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName==="Monday,"||listName==="Tuesday,"||listName==="Wesnesday,"||listName==="Thursday,"||listName==="Friday,"||listName==="Saturday,"||listName==="Sunday,"){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if(!err){
                console.log("successfully deleted");
                res.redirect("/");
            }
        });
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,fiundList){
            if(!err){
                console.log("Successfully deleted");
                res.redirect("/"+listName);
            }
        });
    }
});

app.listen(3000, function(){
    console.log("server is running at port 3000");
});