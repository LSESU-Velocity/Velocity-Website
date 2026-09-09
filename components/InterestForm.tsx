import React from 'react';
import { GoogleInterestForm } from './GoogleInterestForm';

export const InterestForm: React.FC = () => {
    return (
        <section className="py-48 px-6 bg-velocity-black relative z-10">
            {/* Top gradient separator */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-gray-800 via-velocity-red to-gray-800" />

            <div className="max-w-3xl mx-auto">
                <div className="mb-16 md:text-center">
                    <h2 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-2">
                        Express your <span className="text-velocity-red">Interest</span>
                    </h2>
                    <p className="font-sans text-gray-500 text-sm uppercase tracking-widest">
                        Join the next cohort of builders at LSE.
                    </p>
                </div>

                <div
                    className="relative flex h-[800px] flex-col overflow-hidden border border-white/10"
                >
                    <GoogleInterestForm
                        url="https://docs.google.com/forms/d/e/1FAIpQLScH0kmYkrgIXmTtPfT49iTAILEFfO2R_dfolsinRq_-8VqEzA/viewform"
                        title="Express Interest Form"
                    />
                </div>
            </div>
        </section>
    );
};
