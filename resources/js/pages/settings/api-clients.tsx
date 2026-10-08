import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Client = {
    id: number;
    name: string;
    description: string | null;
    owner: string | null;
    abilities: string[];
    expires_at: string | null;
    revoked_at: string | null;
    last_used_at: string | null;
    is_active: boolean;
    created_at: string;
};

type PageProps = {
    clients: Client[];
    availableAbilities: string[];
    flashToken: string | null;
    flashClientId: number | null;
};

export default function ApiClients() {
    const { clients, availableAbilities, flashToken } = usePage<PageProps>().props;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [copied, setCopied] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/settings/api-clients',
            {
                name,
                description: description || null,
                abilities: availableAbilities,
                expires_at: expiresAt || null,
            },
            {
                onSuccess: () => {
                    setName('');
                    setDescription('');
                    setExpiresAt('');
                },
            },
        );
    };

    const copyToken = async () => {
        if (!flashToken) {
            return;
        }
        await navigator.clipboard.writeText(flashToken);
        setCopied(true);
    };

    return (
        <>
            <Head title="API clients" />

            <h1 className="sr-only">API clients</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="API clients"
                    description="Create and manage Sanctum tokens for partner systems. Tokens are shown once."
                />

                {flashToken && (
                    <div className="rounded-md border p-4">
                        <p className="text-sm font-medium">Copy this token now. It won't be shown again.</p>
                        <code className="mt-2 block break-all rounded border p-2 text-xs">{flashToken}</code>
                        <Button className="mt-2" size="sm" onClick={copyToken}>
                            {copied ? 'Copied' : 'Copy to clipboard'}
                        </Button>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 rounded-md border p-4">
                    <div className="grid gap-2">
                        <Label htmlFor="client-name">Name</Label>
                        <Input
                            id="client-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="XYZ Budget Office — sync service"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="client-description">Purpose (optional)</Label>
                        <Input
                            id="client-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What will this client access and why?"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="client-expires">Expires (optional, defaults to 1 year)</Label>
                        <Input
                            id="client-expires"
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Abilities: {availableAbilities.join(', ')}
                    </p>
                    <Button type="submit">New client</Button>
                </form>

                <div className="space-y-2">
                    {clients.map((client) => (
                        <div key={client.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium">
                                    {client.name}{' '}
                                    {!client.is_active && (
                                        <span className="text-xs text-red-600">(inactive)</span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {client.abilities.join(', ')} · expires{' '}
                                    {client.expires_at ?? '—'} · last used {client.last_used_at ?? 'never'}
                                </p>
                            </div>
                            {client.is_active && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            if (confirm(`Rotate token for ${client.name}? Old token stops working immediately.`)) {
                                                router.post(`/settings/api-clients/${client.id}/rotate`);
                                            }
                                        }}
                                    >
                                        Rotate
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            if (confirm(`Revoke ${client.name}? This cannot be undone.`)) {
                                                router.post(`/settings/api-clients/${client.id}/revoke`);
                                            }
                                        }}
                                    >
                                        Revoke
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}
                    {clients.length === 0 && (
                        <p className="text-sm text-muted-foreground">No API clients yet.</p>
                    )}
                </div>
            </div>
        </>
    );
}
