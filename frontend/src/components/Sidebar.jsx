import React from 'react'
import { NavLink } from 'react-router-dom'
import { FaBox, FaCog, FaHome, FaShoppingCart, FaSignOutAlt, FaTable, FaTruck, FaUsers } from "react-icons/fa"

const Sidebar = () => {
    const menuItems = [
        { name: "Dashboard", path: "/admin-dashboard", icon: <FaHome />, isParent: true },
        { name: "Categories", path: "/admin-dashboard/categories", icon: <FaTable />, isParent: false },
        { name: "Products", path: "/admin-dashboard/products", icon: <FaBox />, isParent: false },
        { name: "Suppliers", path: "/admin-dashboard/suppliers", icon: <FaTruck />, isParent: false },
        { name: "Orders", path: "/admin-dashboard/orders", icon: <FaShoppingCart />, isParent: false },
        { name: "Users", path: "/admin-dashboard/users", icon: <FaUsers />, isParent: false },
        { name: "Profile", path: "/admin-dashboard/profile", icon: <FaCog />, isParent: false },
        { name: "Logout", path: "/login", icon: <FaSignOutAlt />, isParent: false }
    ]

    return (
        <div className='flex flex-col h-screen p-3 bg-black text-white w-16 md:w-64 transition-all duration-300'>
            <div className='mb-6 p-2 font-bold border-b border-gray-800 text-center md:text-left'>
                <span className='hidden md:block text-xl font-bold'>Inventory MS</span>
                <span className='md:hidden text-xl font-bold'>IMS</span>
            </div>

            <nav className='flex-1'>
                <ul className='space-y-1'>
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                end={item.isParent}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center justify-center md:justify-start gap-4 p-3 rounded-lg transition-colors duration-200 ${isActive
                                        ? 'bg-blue-600 text-white font-semibold'
                                        : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                                    }`
                                }
                            >
                                <span className='text-xl'>{item.icon}</span>
                                <span className='hidden md:inline text-sm'>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}

export default Sidebar