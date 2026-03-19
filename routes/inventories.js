var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

function isValidQuantity(quantity) {
    return Number(quantity) > 0;
}

async function getInventoryPopulatedById(id) {
    return await inventoryModel.findById(id).populate({
        path: 'product',
        match: { isDeleted: false },
        populate: {
            path: 'category',
            select: 'name slug image'
        }
    });
}

// GET ALL INVENTORIES
router.get('/', async function (req, res) {
    try {
        let data = await inventoryModel.find().populate({
            path: 'product',
            match: { isDeleted: false },
            populate: {
                path: 'category',
                select: 'name slug image'
            }
        });

        data = data.filter(function (item) {
            return item.product !== null;
        });

        res.send(data);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
});

// GET INVENTORY BY ID
router.get('/:id', async function (req, res) {
    try {
        let id = req.params.id;
        let result = await getInventoryPopulatedById(id);

        if (result && result.product) {
            res.send(result);
        } else {
            res.status(404).send({
                message: 'INVENTORY NOT FOUND'
            });
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        });
    }
});

// ADD STOCK
router.post('/add-stock', async function (req, res) {
    try {
        let { product, quantity } = req.body;
        quantity = Number(quantity);

        if (!product || !isValidQuantity(quantity)) {
            return res.status(400).send({
                message: 'product va quantity phai hop le, quantity > 0'
            });
        }

        let inventory = await inventoryModel.findOne({ product: product });

        if (!inventory) {
            return res.status(404).send({
                message: 'INVENTORY NOT FOUND'
            });
        }

        inventory.stock += quantity;
        await inventory.save();

        let result = await getInventoryPopulatedById(inventory._id);
        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

// REMOVE STOCK
router.post('/remove-stock', async function (req, res) {
    try {
        let { product, quantity } = req.body;
        quantity = Number(quantity);

        if (!product || !isValidQuantity(quantity)) {
            return res.status(400).send({
                message: 'product va quantity phai hop le, quantity > 0'
            });
        }

        let inventory = await inventoryModel.findOne({ product: product });

        if (!inventory) {
            return res.status(404).send({
                message: 'INVENTORY NOT FOUND'
            });
        }

        if (inventory.stock < quantity) {
            return res.status(400).send({
                message: 'STOCK KHONG DU'
            });
        }

        inventory.stock -= quantity;
        await inventory.save();

        let result = await getInventoryPopulatedById(inventory._id);
        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

// RESERVATION: GIAM STOCK, TANG RESERVED
router.post('/reservation', async function (req, res) {
    try {
        let { product, quantity } = req.body;
        quantity = Number(quantity);

        if (!product || !isValidQuantity(quantity)) {
            return res.status(400).send({
                message: 'product va quantity phai hop le, quantity > 0'
            });
        }

        let inventory = await inventoryModel.findOne({ product: product });

        if (!inventory) {
            return res.status(404).send({
                message: 'INVENTORY NOT FOUND'
            });
        }

        if (inventory.stock < quantity) {
            return res.status(400).send({
                message: 'STOCK KHONG DU DE RESERVATION'
            });
        }

        inventory.stock -= quantity;
        inventory.reserved += quantity;
        await inventory.save();

        let result = await getInventoryPopulatedById(inventory._id);
        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

// SOLD: GIAM RESERVED, TANG SOLDCOUNT
router.post('/sold', async function (req, res) {
    try {
        let { product, quantity } = req.body;
        quantity = Number(quantity);

        if (!product || !isValidQuantity(quantity)) {
            return res.status(400).send({
                message: 'product va quantity phai hop le, quantity > 0'
            });
        }

        let inventory = await inventoryModel.findOne({ product: product });

        if (!inventory) {
            return res.status(404).send({
                message: 'INVENTORY NOT FOUND'
            });
        }

        if (inventory.reserved < quantity) {
            return res.status(400).send({
                message: 'RESERVED KHONG DU DE SOLD'
            });
        }

        inventory.reserved -= quantity;
        inventory.soldCount += quantity;
        await inventory.save();

        let result = await getInventoryPopulatedById(inventory._id);
        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

module.exports = router;