'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function AuthComponent() {
    return (
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Connexion Covoit'Hôpital</h2>
            <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                theme="light"
                providers={[]}
                localization={{
                    variables: {
                        sign_in: {
                            email_label: 'Email',
                            password_label: 'Mot de passe',
                            button_label: 'Se connecter',
                        },
                        sign_up: {
                            email_label: 'Email',
                            password_label: 'Mot de passe',
                            button_label: "S'inscrire",
                        },
                    },
                }}
            />
        </div>
    )
}
