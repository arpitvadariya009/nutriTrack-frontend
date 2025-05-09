import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import './Home.css';

// Health-related icons and illustrations
import { FaLeaf, FaAppleAlt, FaUtensils, FaCalendarAlt, FaChartLine, FaTrashAlt, FaPlusCircle, FaListAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

function Home() {
    const [loggedInUser, setLoggedInUser] = useState('');
    const [activeTab, setActiveTab] = useState('add-meal');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [meals, setMeals] = useState([
        { time: '08:00 AM', food: '' },
        { time: '12:30 PM', food: '' },
        { time: '04:00 PM', food: '' },
        { time: '07:30 PM', food: '' }
    ]);
    const [reports, setReports] = useState([]);
    const [reportType, setReportType] = useState('0'); // 0 for weekly, 1 for monthly
    const [averageScore, setAverageScore] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('loggedInUser');
        if (!user) {
            navigate('/login');
            return;
        }
        setLoggedInUser(user);
        fetchReports('0'); // Initially fetch weekly reports
    }, [navigate]);

    const getScoreColor = (score) => {
        if (score >= 80) return 'very-good';
        if (score >= 60) return 'good';
        if (score >= 40) return 'moderate';
        if (score >= 20) return 'poor';
        return 'very-poor';
    }

    const getScoreCategory = (score) => {
        if (score >= 80) return 'Very Good';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Poor';
        return 'Very Poor';
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        handleSuccess('Successfully logged out');
        setTimeout(() => {
            navigate('/login');
        }, 1000);
    }

    const handleMealChange = (index, field, value) => {
        const updatedMeals = [...meals];
        updatedMeals[index][field] = value;
        setMeals(updatedMeals);
    }

    const addMealRow = () => {
        setMeals([...meals, { time: '', food: '' }]);
    }

    const removeMealRow = (index) => {
        if (meals.length > 1) {
            const updatedMeals = [...meals];
            updatedMeals.splice(index, 1);
            setMeals(updatedMeals);
        } else {
            handleError('At least one meal is required');
        }
    }

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    }

    const submitMeals = async () => {
        try {
            // Validate inputs
            const hasEmptyFields = meals.some(meal => !meal.time || !meal.food);
            if (hasEmptyFields) {
                handleError('Please fill in all meal details');
                return;
            }

            setIsLoading(true);

            const userId = localStorage.getItem('userId');
            const payload = {
                userId,
                date: formatDate(selectedDate),
                meals: meals.map(meal => ({
                    time: meal.time,
                    food: meal.food
                }))
            };

            const headers = {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            };

            const response = await axios.post('http://localhost:9000/report/create', payload, headers);

            if (response.data.success) {
                handleSuccess('Meal report created successfully');
                // Reset form
                setMeals([
                    { time: '08:00 AM', food: '' },
                    { time: '12:30 PM', food: '' },
                    { time: '04:00 PM', food: '' },
                    { time: '07:30 PM', food: '' }
                ]);
                // Refresh reports
                fetchReports(reportType);
            } else {
                handleError(response.data.message || 'Failed to create report');
            }
        } catch (err) {
            handleError(err.response?.data?.message || 'Error submitting meals');
        } finally {
            setIsLoading(false);
        }
    }

    const fetchReports = async (type) => {
        try {
            setIsLoading(true);
            const userId = localStorage.getItem('userId');

            const headers = {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            };

            const response = await axios.get(`http://localhost:9000/report/all?userId=${userId}&type=${type}`, headers);

            if (response.data.success) {
                setReports(response.data.reports);
                setAverageScore(response.data.averageScore);
                setReportType(type);
            } else {
                handleError('Failed to fetch reports');
            }
        } catch (err) {
            handleError(err.response?.data?.message || 'Error fetching reports');
        } finally {
            setIsLoading(false);
        }
    }

    const deleteReport = async (id) => {
        try {
            setIsLoading(true);

            const headers = {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            };

            const response = await axios.delete(`http://localhost:9000/report/delete?id=${id}`, headers);

            if (response.data.success) {
                handleSuccess('Report deleted successfully');
                fetchReports(reportType);
            } else {
                handleError(response.data.message || 'Failed to delete report');
            }
        } catch (err) {
            handleError(err.response?.data?.message || 'Error deleting report');
        } finally {
            setIsLoading(false);
        }
    }

    const formatDateDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    return (
        <div className="home-container">
            <motion.div
                className="header"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="logo">
                    <FaLeaf className="logo-icon" />
                    <h1>NutriTrack</h1>
                </div>
                <div className="user-controls">
                    <span className="welcome-text">Welcome, {loggedInUser}</span>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </motion.div>

            <div className="main-content mt-120">
                <motion.div
                    className="tabs"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <button
                        className={`tab-btn ${activeTab === 'add-meal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('add-meal')}
                    >
                        <FaUtensils /> Add Meals
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('reports');
                            fetchReports(reportType);
                        }}
                    >
                        <FaChartLine /> View Reports
                    </button>
                </motion.div>

                {activeTab === 'add-meal' && (
                    <motion.div
                        className="add-meal-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="form-header">
                            <h2><FaUtensils /> Log Your Meals</h2>
                            <div className="date-selector">
                                <FaCalendarAlt className="calendar-icon" />
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={date => setSelectedDate(date)}
                                    className="date-picker"
                                    dateFormat="yyyy-MM-dd"
                                    maxDate={new Date()}
                                />
                            </div>
                        </div>

                        <div className="meal-form">
                            <div className="meal-form-header">
                                <div className="meal-time-header">Time</div>
                                <div className="meal-food-header">What did you eat?</div>
                                <div className="meal-action-header">Action</div>
                            </div>

                            {meals.map((meal, index) => (
                                <motion.div
                                    className="meal-row"
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <div className="meal-time">
                                        <input
                                            type="text"
                                            value={meal.time}
                                            onChange={(e) => handleMealChange(index, 'time', e.target.value)}
                                            placeholder="e.g. 08:00 AM"
                                        />
                                    </div>
                                    <div className="meal-food">
                                        <input
                                            type="text"
                                            value={meal.food}
                                            onChange={(e) => handleMealChange(index, 'food', e.target.value)}
                                            placeholder="e.g. Oatmeal with berries"
                                        />
                                    </div>
                                    <div className="meal-action">
                                        <button
                                            className="remove-meal-btn"
                                            onClick={() => removeMealRow(index)}
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            <div className="meal-form-footer">
                                <button className="add-row-btn" onClick={addMealRow}>
                                    <FaPlusCircle /> Add Another Meal
                                </button>
                                <button
                                    className="submit-meals-btn"
                                    onClick={submitMeals}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Submitting...' : 'Submit Meals'}
                                </button>
                            </div>
                        </div>

                        <div className="meal-info-section">
                            <div className="meal-info-card">
                                <FaAppleAlt className="meal-info-icon" />
                                <h3>Why Track Your Meals?</h3>
                                <p>Tracking your daily food intake helps you maintain a healthy diet and understand your nutrition habits better.</p>
                            </div>
                            <div className="meal-info-card">
                                <FaLeaf className="meal-info-icon" />
                                <h3>Get Personalized Insights</h3>
                                <p>Our AI will analyze your meals and provide quality scores and personalized recommendations.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'reports' && (
                    <motion.div
                        className="reports-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="reports-header">
                            <h2><FaListAlt /> Your Nutrition Reports</h2>
                            <div className="report-type-toggle">
                                <button
                                    className={`report-toggle-btn ${reportType === '0' ? 'active' : ''}`}
                                    onClick={() => fetchReports('0')}
                                >
                                    Weekly
                                </button>
                                <button
                                    className={`report-toggle-btn ${reportType === '1' ? 'active' : ''}`}
                                    onClick={() => fetchReports('1')}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>

                        {averageScore !== null && (
                            <motion.div
                                className={`overall-score ${getScoreColor(averageScore)}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="score-circle">
                                    <span className="score-value">{averageScore}</span>
                                </div>
                                <div className="score-details">
                                    <h3>Overall Nutrition Score</h3>
                                    <p className="score-category">{getScoreCategory(averageScore)}</p>
                                    <p className="score-period">
                                        {reportType === '0' ? 'Last 7 days' : 'Last 30 days'}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {reports.length > 0 ? (
                            <div className="reports-list">
                                {reports.map((report, index) => (
                                    <motion.div
                                        className={`report-card ${getScoreColor(report.averageScore)}`}
                                        key={report._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <div className="report-header">
                                            <div className="report-date">
                                                <FaCalendarAlt />
                                                <span>{formatDateDisplay(report.date)}</span>
                                            </div>
                                            <div className="report-score">
                                                <span className="score-label">Score</span>
                                                <span className="score-value">{report.averageScore}</span>
                                            </div>
                                            <button
                                                className="delete-report-btn"
                                                onClick={() => deleteReport(report._id)}
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </div>

                                        <div className="report-message">
                                            <p>{report.message}</p>
                                        </div>

                                        <div className="report-meals">
                                            <h4>Meals</h4>
                                            <div className="meals-list">
                                                {report.meals.map((meal, mealIndex) => (
                                                    <div className="meal-item" key={mealIndex}>
                                                        <div className="meal-time-info">
                                                            <span>{meal.time}</span>
                                                        </div>
                                                        <div className="meal-food-info">
                                                            <span>{meal.food}</span>
                                                        </div>
                                                        <div className="meal-score-info">
                                                            <span className={`meal-quality ${getScoreColor(meal.qualityScore)}`}>
                                                                {meal.qualityScore}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-reports">
                                <FaUtensils className="no-reports-icon" />
                                <h3>No Reports Yet</h3>
                                <p>Start tracking your meals to see nutrition reports here.</p>
                                <button
                                    className="add-meals-btn"
                                    onClick={() => setActiveTab('add-meal')}
                                >
                                    Add Your Meals
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            <motion.div
                className="footer"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <p>© 2025 NutriTrack. All rights reserved.</p>
            </motion.div>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default Home;