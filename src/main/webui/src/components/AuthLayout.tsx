import React from 'react';
import { BrandMark } from './BrandMark';

interface AuthLayoutProps {
    title: string;
    children: React.ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F2] p-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex justify-center">
                    <BrandMark />
                </div>
                <div className="rounded-xl border border-[#EAE1D5] bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="mb-1 text-center font-display text-2xl font-semibold text-[#291D16]">
                        {title}
                    </h1>
                    {children}
                </div>
            </div>
        </div>
    );
}
