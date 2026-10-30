import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'

import './App.css'

import Header from './components/Header/Header'
import Main from './components/Main/Main'
import News from './components/News/News'
import Calendar from './components/Calendar/Calendar'
import DayInCalendar from './components/DayInCalendar/DayInCalendar'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import InfoAboutAccount from './components/InfoAboutAccount/InfoAboutAccount'
import Error from './components/Error/Error'
import AddNews from './components/AddNews/AddNews'
import EventForm from './components/EventForm/EventForm'
import ArticleDetail from './components/ArticleDetail/ArticleDetail'
import EditNews from './components/EditNews/EditNews'

function App() {
  
  return (
    <>
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/news" element={<News />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/:date" element={<DayInCalendar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<InfoAboutAccount />} />
          <Route path="/add_news" element={<AddNews />} />
          <Route path="/event_form" element={<EventForm />} />
          <Route path="/edit_news/:id" element={<EditNews />} />
          <Route path="/news/:id" element={<ArticleDetail />} />
          <Route path="*" element={<Error />} />
          
        </Routes>
    </>
  )
}

export default App
