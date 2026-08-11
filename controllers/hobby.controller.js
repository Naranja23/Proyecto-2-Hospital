const { User, Hobby } = require('../models/index.js')
const { Op } = require('sequelize')

const getHobbies = async (req, res) => {
    try {
        const hobbies = await Hobby.findAll()
        if (hobbies.length === 0) {
            return res.status(404).json("Hobbies no encontrados")
        }
        res.status(200).json(hobbies)
    } catch (error) {
        res.status(500).json(error)
    }
}

const getHobbyByID = async (req, res) => {
    try {
        const hobby = await Hobby.findByPk(Number(req.params.id))
        if (!hobby) {
            return res.status(404).json(`El hobby con el ID ${req.params.id} no fue encontrado`)
        }
        res.status(200).json(hobby)
    } catch (error) {
        res.status(500).json(error)
    }
}

const createHobby = async (req, res) => {
    try {
        const newHobby = await Hobby.create({ name: req.body.name })
        res.status(201).json(newHobby)
    } catch (error) {
        res.status(500).json(error)
    }
}

const putHobby = async (req, res) => {
    try {
        const hobby = await Hobby.findByPk(Number(req.params.id))
        if (!hobby) {
            return res.status(404).json(`El Hobby con el ID ${req.params.id} no fue encontrado`)
        }
        hobby.name = req.body.name
        await hobby.save()

        res.status(200).json(hobby)
    } catch (error) {
        res.status(500).json(error)
    }
}

const deleteHobby = async (req, res) => {
    try {
        const deletedHobby = await Hobby.findByPk(Number(req.params.id))
        if (!deletedHobby) {
            return res.status(404).json(`El Hobby con el ID ${req.params.id} no fue encontrado`)
        }
        await deletedHobby.destroy()

        res.status(200).json({ message: "El hobby fue eliminado con éxito" })
    } catch (error) {
        res.status(500).json(error)
    }
}

const estacion = async (req, res) => {
    try {
        const user = await User.findByPk(Number(req.params.idUser), {
            where: { estacion: { [Op.eq]: req.params.estacion } }
        }, {
            include: {
                model: Hobby,
                through: { attributes: [] }
            }
        })
        if (!user) {
            return res.status(404).json("No existe")
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error)
    }
}

const capacidad = async (req, res) => {
    try {
        const { userId, hobbyId } = req.params
        const user = await user.findByPk(userId);
        const hobby = await hobby.findByPk(hobbyId);
        const cantidaUsers = await hobby.getUser();
        if (cantidaUsers.length >= hobby.maxCapacity) {
            res.status(400).json({ message: "pene" })
        }
        await user.addHobby(hobby);
        res.status(200).json({ message: "agregado" });

    } catch (error) {
        res.status(500).json(error)
    }
}

const AgregarUser = async (req, res) => {
    try {


    } catch (error) {
        res.status(200).json(error)
    }
}
const { Op } = require("sequelize"); // arriba del archivo

const deleteLowRatedHobbies = async (req, res) => {
    try {
        const deletedCount = await Hobby.destroy({
            where: { rate: { [Op.lt]: 2 } },
        });
        res.status(200).json({ message: `${deletedCount} hobbies eliminados` });
    } catch (error) {
        res.status(500).json(error);
    }
};
const completeHobby = async (req, res) => {
    try {
        const { id } = req.params;
        const hobby = await Hobby.findByPk(id);
        if (!hobby) {
            return res.status(404).json({ message: "Hobby no encontrado" });
        }
        await Hobby.update(
            { completedCount: hobby.completedCount + 1 },
            { where: { id } },
        );
        const updatedHobby = await Hobby.findByPk(id);
        res.status(200).json(updatedHobby);
    } catch (error) {
        res.status(500).json(error);
    }
};
const addUserToHobby = async (req, res) => {
    try {
        const { userId, hobbyId } = req.params;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        const hobby = await Hobby.findByPk(hobbyId);
        if (!hobby) {
            return res.status(404).json({ message: "Hobby no encontrado" });
        }
        const currentUsers = await hobby.getUsers();
        if (currentUsers.length >= hobby.maxCapacity) {
            return res.status(400).json({ message: "El hobby alcanzó su capacidad máxima" });
        }
        await user.addHobby(hobby);
        res.status(200).json({ message: "Usuario agregado al hobby" });
    } catch (error) {
        res.status(500).json(error);
    }
};

const aplicarDescuento = async (req, res) => {
    try {
        const { id, codigoDescuento } = req.params;
        const hobby = await Hobby.findByPk(id);
        if (!hobby) {
            return res.status(404).json({ message: "Hobby no encontrado" });
        }
        if (hobby.codigoDescuento !== codigoDescuento) {
            res.status(404).json({ message: "no se encontro este codigo" })
        } else {
            const aplicar = await hobby.price - hobby.codigoDescuento
            res.status(200).json(aplicar)
        }
    } catch (error) {
        res.status(500).json(error)
    }
}

module.exports = {
    getHobbies,
    getHobbyByID,
    createHobby,
    putHobby,
    deleteHobby,
    aplicarDescuento
}