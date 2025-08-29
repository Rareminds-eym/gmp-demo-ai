import React, { useState } from 'react';
import UserSearch from './components/UserSearch';
import CaseQuestions from './components/CaseQuestions';


function App() {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Case-Based Quiz System
          </h1>
          <p className="text-lg text-gray-600">
            Search for users by email and view their hackathon innovation journey
          </p>
        </div>


       
        <div className="max-w-6xl mx-auto">
         
          <UserSearch 
            onUserSelect={handleUserSelect} 
            selectedUser={selectedUser} 
          />

          <CaseQuestions 
            user={selectedUser} 
          />
        </div>
        
      </div>
    </div>
  );
}

export default App;
