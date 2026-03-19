var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let categoryModel = require('../schemas/categories');

router.get('/', async function (req, res) {
  try {
    let data = await categoryModel.find({
      isDeleted: false
    });
    res.send(data);
  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

router.get('/:id', async function (req, res) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findOne({
      _id: id,
      isDeleted: false
    });

    if (result) {
      res.send(result);
    } else {
      res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }
  } catch (error) {
    res.status(404).send({
      message: error.message
    });
  }
});

router.post('/', async function (req, res) {
  try {
    let newCate = new categoryModel({
      name: req.body.name,
      slug: slugify(req.body.name, {
        replacement: '-',
        remove: undefined,
        lower: true,
        strict: true
      }),
      image: req.body.image
    });

    await newCate.save();

    res.status(201).send(newCate);
  } catch (error) {
    res.status(400).send({
      message: error.message
    });
  }
});

router.put('/:id', async function (req, res) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findByIdAndUpdate(id, req.body, {
      new: true
    });

    res.send(result);
  } catch (error) {
    res.status(400).send({
      message: error.message
    });
  }
});

router.delete('/:id', async function (req, res) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findOne({
      _id: id,
      isDeleted: false
    });

    if (result) {
      result.isDeleted = true;
      await result.save();
      res.send(result);
    } else {
      res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }
  } catch (error) {
    res.status(400).send({
      message: error.message
    });
  }
});

module.exports = router;