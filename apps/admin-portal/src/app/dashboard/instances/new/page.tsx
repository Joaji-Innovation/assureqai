'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Server, ChevronLeft, Loader2, Globe, HardDrive, CheckCircle, Database } from 'lucide-react';
import Link from 'next/link';
import { instanceApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

export default function NewInstancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();
  const [deploymentType, setDeploymentType] = useState<'cloud' | 'on-premise'>('cloud');

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    plan: 'standard',
    region: 'us-east-1',
    adminEmail: '',
    // On-Premise / VPS Config
    vpsHost: '',
    vpsUser: 'root',
    vpsPort: '22',
    vpsPassword: '',
    // Database Config
    databaseType: 'shared' as 'shared' | 'isolated_db' | 'isolated_server',
    mongoUri: '',
    dbName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        plan: formData.plan,
        companyName: formData.name, // Mapping mostly for display
        contactEmail: formData.adminEmail,
        domain: {
          subdomain: formData.subdomain,
          customDomain: formData.customDomain || undefined
        },
        settings: {
          region: deploymentType === 'cloud' ? formData.region : undefined,
          deploymentType
        }
      };

      if (deploymentType === 'on-premise') {
        payload.vps = {
          host: formData.vpsHost,
          sshUser: formData.vpsUser,
          sshPort: parseInt(formData.vpsPort, 10),
          password: formData.vpsPassword
        };
      }

      // Database configuration
      payload.database = {
        type: formData.databaseType,
        mongoUri: formData.databaseType === 'isolated_server' ? formData.mongoUri : undefined,
        dbName: formData.databaseType === 'isolated_db' ? formData.dbName : undefined,
        isConfigured: true
      };

      await instanceApi.create(payload);
      success('Instance created successfully! Redirecting...');

      // Redirect to instances list after short delay
      setTimeout(() => {
        router.push('/dashboard/instances');
      }, 1000);
    } catch (error) {
      console.error('Failed to create instance', error);
      showError('Failed to create instance. Please check console.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/instances" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Deploy New Instance</h1>
          <p className="text-muted-foreground">Provision a new dedicated environment</p>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Deployment Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setDeploymentType('cloud')}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deploymentType === 'cloud' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${deploymentType === 'cloud' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Server className="h-5 w-5" />
                </div>
                <span className="font-semibold">AssureQ Cloud</span>
              </div>
              <p className="text-sm text-muted-foreground">Fully managed SaaS deployment on our infrastructure.</p>
            </div>

            <div
              onClick={() => setDeploymentType('on-premise')}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deploymentType === 'on-premise' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${deploymentType === 'on-premise' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <HardDrive className="h-5 w-5" />
                </div>
                <span className="font-semibold">On-Premise / Client Server</span>
              </div>
              <p className="text-sm text-muted-foreground">Deploy to your own servers or private cloud.</p>
            </div>
          </div>

          <div className="space-y-6 border-t border-border pt-6">
            <h3 className="text-lg font-semibold">Instance Details</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Instance Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Acme Production"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subdomain *</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="acme"
                  />
                  <span className="px-3 py-2 bg-muted border border-border border-l-0 rounded-r-lg text-muted-foreground text-sm">
                    .assureqai.com
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-3 w-3" /> Custom Domain (Optional)
              </label>
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="qa.acme-corp.com"
              />
              <p className="text-xs text-muted-foreground">You will need to verify DNS ownership after creation.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan Type</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="trial">Trial</option>
                  <option value="standard">Standard</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {deploymentType === 'cloud' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-central-1">Europe (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Database Configuration */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Database Configuration
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, databaseType: 'shared' })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all text-center ${formData.databaseType === 'shared' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <span className="text-sm font-medium">Shared DB</span>
                  <p className="text-xs text-muted-foreground mt-1">Same MongoDB, scoped by projectId</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, databaseType: 'isolated_db' })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all text-center ${formData.databaseType === 'isolated_db' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <span className="text-sm font-medium">Isolated DB</span>
                  <p className="text-xs text-muted-foreground mt-1">Separate database, same server</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, databaseType: 'isolated_server' })}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition-all text-center ${formData.databaseType === 'isolated_server' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <span className="text-sm font-medium">Custom Server</span>
                  <p className="text-xs text-muted-foreground mt-1">Different MongoDB server</p>
                </div>
              </div>

              {formData.databaseType === 'isolated_db' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">Database Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.dbName}
                    onChange={(e) => setFormData({ ...formData, dbName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="assureqai_acme"
                  />
                </div>
              )}

              {formData.databaseType === 'isolated_server' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">MongoDB Connection URI *</label>
                  <input
                    type="text"
                    required
                    value={formData.mongoUri}
                    onChange={(e) => setFormData({ ...formData, mongoUri: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="mongodb://user:pass@host:27017/dbname"
                  />
                  <p className="text-xs text-muted-foreground">Full MongoDB URI including auth and database name</p>
                </div>
              )}
            </div>

            {deploymentType === 'on-premise' && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                  <HardDrive className="h-4 w-4" /> Server Configuration
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Host IP / Hostname *</label>
                    <input
                      type="text"
                      required
                      value={formData.vpsHost}
                      onChange={(e) => setFormData({ ...formData, vpsHost: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="192.168.1.10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">SSH User *</label>
                    <input
                      type="text"
                      required
                      value={formData.vpsUser}
                      onChange={(e) => setFormData({ ...formData, vpsUser: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="root"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">SSH Port *</label>
                    <input
                      type="number"
                      required
                      value={formData.vpsPort}
                      onChange={(e) => setFormData({ ...formData, vpsPort: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="22"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">SSH Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.vpsPassword}
                      onChange={(e) => setFormData({ ...formData, vpsPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Email *</label>
              <input
                type="email"
                required
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="admin@company.com"
              />
              <p className="text-xs text-muted-foreground">Initial credentials will be sent to this email.</p>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4 border-t border-border">
            <Link
              href="/dashboard/instances"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {loading ? 'Provisioning...' : 'Deploy Instance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
