import { Request, Response, NextFunction } from 'express';
import SupplierService from '../services/supplier.service';

const SupplierController = {
  /**
   * @swagger
   * /suppliers:
   *   get:
   *     summary: Get all suppliers
   *     tags: [Suppliers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: List of suppliers
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Supplier'
   */
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;
      const offset = Number(req.query.offset) || 0;
      const suppliers = await SupplierService.getAll(limit, offset);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /suppliers/{id}:
   *   get:
   *     summary: Get a supplier by ID
   *     tags: [Suppliers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Supplier details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Supplier'
   *       404:
   *         description: Supplier not found
   */
  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await SupplierService.getById(Number(req.params.id));
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /suppliers:
   *   post:
   *     summary: Create a new supplier
   *     tags: [Suppliers]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - company_name
   *             properties:
   *               name:
   *                 type: string
   *               company_name:
   *                 type: string
   *               city:
   *                 type: string
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *     responses:
   *       201:
   *         description: Supplier created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Supplier'
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await SupplierService.create(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /suppliers/{id}:
   *   put:
   *     summary: Update a supplier
   *     tags: [Suppliers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               company_name:
   *                 type: string
   *               city:
   *                 type: string
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *     responses:
   *       200:
   *         description: Supplier updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Supplier'
   *       404:
   *         description: Supplier not found
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await SupplierService.update(Number(req.params.id), req.body);
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /suppliers/{id}:
   *   delete:
   *     summary: Delete a supplier
   *     tags: [Suppliers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Supplier deleted successfully
   *       404:
   *         description: Supplier not found
   */
  async destroy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await SupplierService.delete(Number(req.params.id));
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }
      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

export default SupplierController;
