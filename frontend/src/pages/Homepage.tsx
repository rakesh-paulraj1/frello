import { useState } from 'react';
import Button from '../components/Button';
import SignUpForm from '../components/SignUpForm';
import SignInForm from '../components/SignInForm';

export const Homepage = () => {
  const [activeForm, setActiveForm] = useState<'signup' | 'signin'>('signup');

  return (
    <>
      <div className="h-screen w-full relative overflow-hidden" style={{ backgroundColor: '#efe5df' }}>
        
        {/* Top Navigation Bar */}
        <div className="relative z-10 px-11 pt-8">
          <div className="border-4 border-black bg-white px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">Frello</h2>
              <div className="flex gap-4">
                <Button 
                  variant="dashed" 
                  size="md"
                  onClick={() => setActiveForm('signup')}
                >
                  Sign Up
                </Button>
                <Button 
                  variant="dashed" 
                  size="md"
                  onClick={() => setActiveForm('signin')}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-11 py-8">
          
  
  {/* <div
    className="absolute inset-0 z-0"
    style={{
      background: "#ffffff",
      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.35) 1px, transparent 0)",
      backgroundSize: "20px 20px",
    }}
  /> */}


          <div className="border-4 border-black bg-white p-35">
            <div className="flex items-start justify-between gap-12">
              <div className="flex-1 space-y-6">
                <h1 className="text-6xl font-bold leading-tight">
                  Frello
                </h1>
                <p className="text-lg text-gray-700 max-w-xl leading-relaxed">
                  A Trello-inspired collaboration tool that helps teams organize projects, 
                  manage tasks, and boost productivity. Create boards, lists, and cards to 
                  visualize your workflow and get things done.
                </p>
              </div>

           
              <div className="w-[550px] flex-shrink-0">
                {activeForm === 'signup' && (
                  <SignUpForm onSwitchToSignIn={() => setActiveForm('signin')} />
                )}
                {activeForm === 'signin' && (
                  <SignInForm onSwitchToSignUp={() => setActiveForm('signup')} />
                )}
              </div>
              
            </div>
          </div>
          </div>
       
             
</div>
    </>
  );
};

export default Homepage;
