import React from 'react';
import { ArrowRight, Settings as Lungs, Timer, Clock, BarChart4, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartNow = () => {
    navigate('/login');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ocean-100">
                Master Your <span className="text-seagreen-400">Breath</span>, 
                Extend Your <span className="text-seagreen-400">Limits</span>
              </h1>
              <p className="text-xl text-ocean-200">
                ApneaStatic is a complete freediving breath-hold training system designed to help you increase your breath-hold time safely and efficiently.
              </p>
              <div className="pt-4">
                <button 
                  onClick={handleStartNow}
                  className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-3 px-6 rounded-lg text-lg font-medium flex items-center"
                >
                  Start Training
                  <ArrowRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-ocean-800/70 backdrop-blur rounded-xl p-8 border border-ocean-700/50 shadow-xl">
                <div className="aspect-[4/3] relative bg-ocean-900/70 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Waves className="text-ocean-700/30 w-full h-full" />
                  </div>
                  <div className="relative z-10 text-center p-6">
                    <div className="text-5xl font-bold text-ocean-100 mb-2">02:15</div>
                    <div className="text-xl font-medium text-ocean-300">HOLD</div>
                    <div className="mt-4 w-full bg-ocean-800/60 rounded-full h-2">
                      <div className="bg-seagreen-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="mt-8 flex justify-center space-x-4">
                      <div className="p-3 bg-ocean-800/60 rounded-full">
                        <Timer className="text-seagreen-400" size={24} />
                      </div>
                      <div className="p-3 bg-ocean-700/60 rounded-full">
                        <Clock className="text-ocean-400" size={24} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 bg-ocean-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ocean-100">Why Choose ApneaStatic</h2>
            <p className="text-ocean-300 mt-4 max-w-2xl mx-auto">
              Our specialized training system is designed by freedivers, for freedivers, to help you achieve your full potential.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-ocean-800/50 backdrop-blur rounded-lg p-6 border border-ocean-700/30">
              <div className="p-3 bg-seagreen-900/50 w-fit rounded-full border border-seagreen-800/50 mb-4">
                <Lungs className="text-seagreen-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Customized Training Tables</h3>
              <p className="text-ocean-300">
                Create and customize CO2 and O2 training tables to suit your specific goals and experience level.
              </p>
            </div>
            
            <div className="bg-ocean-800/50 backdrop-blur rounded-lg p-6 border border-ocean-700/30">
              <div className="p-3 bg-seagreen-900/50 w-fit rounded-full border border-seagreen-800/50 mb-4">
                <Timer className="text-seagreen-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Tap Mode for Max Attempts</h3>
              <p className="text-ocean-300">
                Push your limits with max hold sessions using our tap-to-end feature, letting you control when to end your breath-hold.
              </p>
            </div>
            
            <div className="bg-ocean-800/50 backdrop-blur rounded-lg p-6 border border-ocean-700/30">
              <div className="p-3 bg-seagreen-900/50 w-fit rounded-full border border-seagreen-800/50 mb-4">
                <BarChart4 className="text-seagreen-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Performance Tracking</h3>
              <p className="text-ocean-300">
                Track your progress with detailed charts and training history, giving you insights into your improvement over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ocean-100">How ApneaStatic Works</h2>
            <p className="text-ocean-300 mt-4 max-w-2xl mx-auto">
              A simple, effective approach to improve your breath-hold capacity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-ocean-900/30 rounded-lg p-6 border border-ocean-800/50">
              <div className="text-seagreen-400 text-2xl font-bold mb-4">01</div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Choose a Table</h3>
              <p className="text-ocean-300">
                Select from pre-defined training tables or create your own custom sequence.
              </p>
            </div>
            
            <div className="bg-ocean-900/30 rounded-lg p-6 border border-ocean-800/50">
              <div className="text-seagreen-400 text-2xl font-bold mb-4">02</div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Follow the Timer</h3>
              <p className="text-ocean-300">
                Our voice-guided timer lets you focus on your breathing, not on watching the clock.
              </p>
            </div>
            
            <div className="bg-ocean-900/30 rounded-lg p-6 border border-ocean-800/50">
              <div className="text-seagreen-400 text-2xl font-bold mb-4">03</div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Complete Sessions</h3>
              <p className="text-ocean-300">
                Alternate between breathing and holding patterns to challenge your limits safely.
              </p>
            </div>
            
            <div className="bg-ocean-900/30 rounded-lg p-6 border border-ocean-800/50">
              <div className="text-seagreen-400 text-2xl font-bold mb-4">04</div>
              <h3 className="text-xl font-semibold text-ocean-100 mb-2">Track Progress</h3>
              <p className="text-ocean-300">
                Review your performance and watch as your breath-hold capacity increases over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials/Benefits */}
      <section className="py-10 bg-ocean-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ocean-100">Benefits of Regular Training</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-ocean-900/50 rounded-lg p-6 border border-ocean-800/50">
              <h3 className="text-xl font-semibold text-ocean-100 mb-4">For Beginners</h3>
              <ul className="space-y-3 text-ocean-200">
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Build confidence in the water with structured practice</div>
                </li>
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Learn proper breathing techniques for longer, safer dives</div>
                </li>
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Develop CO2 tolerance in a safe, controlled environment</div>
                </li>
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Establish a foundation for progress with consistent training</div>
                </li>
              </ul>
            </div>
            
            <div className="bg-ocean-900/50 rounded-lg p-6 border border-ocean-800/50">
              <h3 className="text-xl font-semibold text-ocean-100 mb-4">For Advanced Freedivers</h3>
              <ul className="space-y-3 text-ocean-200">
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Push beyond plateaus with advanced training tables</div>
                </li>
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Fine-tune your O2 and CO2 tolerance for competition</div>
                </li>
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Maintain peak performance with regular training</div>
                </li>
                <li className="flex">
                  <div className="mr-2 text-seagreen-400">✓</div>
                  <div>Track detailed metrics to identify areas for improvement</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-ocean-100 mb-6">Ready to Transform Your Breath-Hold?</h2>
          <p className="text-ocean-200 mb-8 max-w-2xl mx-auto">
            Join thousands of freedivers who've increased their breath-hold time using ApneaStatic's guided training system.
          </p>
          <button 
            onClick={handleStartNow}
            className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-3 px-8 rounded-lg text-lg font-medium inline-flex items-center"
          >
            Start Training Now
            <ArrowRight className="ml-2" size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;