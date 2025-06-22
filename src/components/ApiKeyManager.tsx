
import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Plus, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ApiKey {
  id: string;
  service_name: string;
  encrypted_key: string;
  is_active: boolean;
  created_at: string;
}

const API_SERVICES = [
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
  { value: 'elevenlabs', label: 'ElevenLabs', placeholder: 'sk_...' },
  { value: 'google_maps', label: 'Google Maps', placeholder: 'AIza...' }
];

const ApiKeyManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({
    service_name: '',
    encrypted_key: ''
  });
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});

  const fetchApiKeys = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.service_name || !formData.encrypted_key.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingKey) {
        const { error } = await supabase
          .from('user_api_keys')
          .update({
            encrypted_key: formData.encrypted_key,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingKey.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'API key updated successfully' });
      } else {
        const { error } = await supabase
          .from('user_api_keys')
          .insert([{
            user_id: user!.id,
            service_name: formData.service_name,
            encrypted_key: formData.encrypted_key
          }]);

        if (error) throw error;
        toast({ title: 'Success', description: 'API key added successfully' });
      }

      setShowDialog(false);
      setEditingKey(null);
      setFormData({ service_name: '', encrypted_key: '' });
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save API key',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
      toast({ title: 'Success', description: 'API key deleted successfully' });
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setFormData({
      service_name: key.service_name,
      encrypted_key: key.encrypted_key
    });
    setShowDialog(true);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(Math.max(key.length - 8, 4)) + key.substring(key.length - 4);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  if (loading) {
    return <div className="text-center py-8">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">Manage your API keys for different services</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingKey(null);
                setFormData({ service_name: '', encrypted_key: '' });
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingKey ? 'Edit API Key' : 'Add New API Key'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Service</label>
                <Select 
                  value={formData.service_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_name: value }))}
                  disabled={!!editingKey}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_SERVICES.map(service => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">API Key</label>
                <Input
                  type="password"
                  value={formData.encrypted_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, encrypted_key: e.target.value }))}
                  placeholder={API_SERVICES.find(s => s.value === formData.service_name)?.placeholder || 'Enter API key'}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingKey ? 'Update' : 'Add'} API Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">Add your API keys to enable AI services</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {API_SERVICES.find(s => s.value === key.service_name)?.label || key.service_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(key.id)}
                    >
                      {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(key)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm bg-muted p-3 rounded">
                  {showKey[key.id] ? key.encrypted_key : maskKey(key.encrypted_key)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Added {new Date(key.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiKeyManager;
