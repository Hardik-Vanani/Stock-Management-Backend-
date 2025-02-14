const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const response = require("../../helpers/response.helper");
const DB = require("../../models");

module.exports = {
    // Login existing user
    loginUser: async (req, res) => {
        try {
            // Get username and password from request body
            const { username, password } = req.body;

            const user = await DB.user.findOne({ username });
            if (!user) return response.NOT_FOUND({ res });

            // Compare password with hashed password
            const ismatch = await bcryptjs.compare(password, user.password);
            if (!ismatch) return response.UNAUTHORIZED({ res });

            const id = user._id,
                name = user.username,
                role = user.role;

            // Generate JWT token
            const token = jwt.sign({ id, name, role }, process.env.SECRET_KEY, { expiresIn: "50d" });

            return response.OK({ res, payload: { id, name, token, role } });
        } catch (error) {
            console.error("Error logging user: ", error);
            return response.INTERNAL_SERVER_ERROR({ res });
        }
    },

    // Create new user
    createUser: async (req, res) => {
        try {
            const { email, username, password, role } = req.body;

            const existingEmail = await DB.user.findOne({ email });
            if (existingEmail) return response.EXISTED({ res });

            const existingUser = await DB.user.findOne({ username });
            if (existingUser) return response.EXISTED({ res });

            // Password hashed by bcryptjs
            const hashedPassword = await bcryptjs.hash(password, 10);
            const newUser = await DB.user.create({ username, password: hashedPassword, email, role });

            return response.OK({ res, payload: { newUser } });
        } catch (error) {
            console.error("Error creating user: ", error);
            return response.INTERNAL_SERVER_ERROR({ res });
        }
    },

    // Update password
    updateUser: async (req, res) => {
        try {
            // Get password from request body
            const { password } = req.body;

            // Get user id from authenticated user
            const user_id = req.user.id;

            if (!password) {
                return response.ALL_REQUIRED({ res });
            }

            // Hash password
            const hashedPassword = await bcryptjs.hash(password, 10);
            const updatedUser = await DB.user.findByIdAndUpdate(user_id, { password: hashedPassword }, { new: true });

            if (!updatedUser) {
                return response.NOT_FOUND({ res });
            }

            return res.status(200).json({ success: true, payload: { updatedUser } });
        } catch (error) {
            console.error("Error updating user: ", error);
            return response.INTERNAL_SERVER_ERROR({ res });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            // Get user id from authenticated user
            const filter = req.user.role === ADMIN ? { _id: req.params.id } : { user_id: req.user.id };

            // Find user by id and delete
            const deletedUser = await DB.user.findByIdAndDelete(filter);

            return response.OK({ res, payload: { deletedUser } });
        } catch (error) {
            console.error("Error deleting user: ", error);
            return response.INTERNAL_SERVER_ERROR({ res });
        }
    },
};
