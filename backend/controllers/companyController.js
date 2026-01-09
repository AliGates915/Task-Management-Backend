import Company from '../models/Company.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { validationResult } from 'express-validator';

export const createCompany = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, email, phone, address } = req.body;

        // Check if company already exists
        const companyExists = await Company.findOne({ name });
        if (companyExists) {
            return res.status(400).json({ message: 'Company already exists' });
        }

        const company = await Company.create({
            name,
            description,
            email,
            phone,
            address,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            company
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            companies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({
            success: true,
            company
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { name, description, email, phone, address, isActive } = req.body;

        let company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check permission
        if (req.user.role !== 'admin' && company.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this company' });
        }

        company = await Company.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                email,
                phone,
                address,
                isActive,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            company
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check permission
        if (req.user.role !== 'admin' && company.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this company' });
        }

        // Check if company has users
        const usersCount = await User.countDocuments({ company: company._id });
        if (usersCount > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete company with active users. Remove users first.' 
            });
        }

        await Company.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Company deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCompanyStats = async (req, res) => {
    try {
        const companyId = req.params.id;
        
        const totalUsers = await User.countDocuments({ company: companyId });
        const activeUsers = await User.countDocuments({ 
            company: companyId, 
            isActive: true 
        });
        
        const totalTasks = await Task.countDocuments({ company: companyId });
        const completedTasks = await Task.countDocuments({ 
            company: companyId, 
            status: 'completed' 
        });
        
        const pendingTasks = await Task.countDocuments({ 
            company: companyId, 
            status: 'pending' 
        });
        
        const inProgressTasks = await Task.countDocuments({ 
            company: companyId, 
            status: 'in-progress' 
        });

        // Get user distribution by role
        const userRoleDistribution = await User.aggregate([
            { $match: { company: companyId } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Get task completion rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Get recent activities
        const recentTasks = await Task.find({ company: companyId })
            .populate('assignedTo', 'name')
            .populate('assignedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                completionRate,
                userRoleDistribution,
                recentTasks: recentTasks.map(task => ({
                    id: task._id,
                    title: task.title,
                    assignedTo: task.assignedTo?.name,
                    status: task.status,
                    progress: task.progress,
                    createdAt: task.createdAt
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};