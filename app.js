const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
const capitalize = require("lodash/capitalize");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// Port
const PORT = process.env.PORT || 3000;

// Database
mongoose.connect(process.env.MONGODB_URL);

// Items Schema
const ItemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", ItemsSchema);
const itemOne = new Item({
  name: "Welcome to your ToDo List",
});
const itemTwo = new Item({
  name: "Hit the + Button to add a new item",
});
const itemThree = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [itemOne, itemTwo, itemThree];

////////////////////////////////////////////////////

// List Schema
const ListSchema = new mongoose.Schema({
  name: String,
  items: [ItemsSchema],
});

const List = mongoose.model("List", ListSchema);
////////////////////////////////////////////////////

// Home
app.get("/", (req, res) => {
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) =>
        err ? console.log(err) : console.log("Saved items to database")
      );
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
////////////////////////////////////////////////////

// Delete

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkBox.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item deleted successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

////////////////////////////////////////////////////
// Work
app.get("/:customListName", (req, res) => {
  const customListName = capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: customListName,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// About
app.get("/about", (req, res) => {
  res.render("about");
});
// Listening on http://localhost:3000
app.listen(PORT, () => {
  console.log(`Server has started successfully`);
});

////////////////////////////////////////////////////
