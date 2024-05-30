const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    vendorName: String,
    mobileNo: {
        type: Number,
        maxlength: 10,
        required: true,
    },
    user_id: String,
});

module.exports = mongoose.model("vendor", schema,);
