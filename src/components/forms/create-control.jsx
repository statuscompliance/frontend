import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createControl } from '@/services/controls';
import { getAllScopes } from '@/services/scopes';

export function ControlForm({ catalogId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    period: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    mashupId: '',
    params: {},
    scopes: {}
  });
  const [loading, setLoading] = useState(false);
  const [_availableScopes, setAvailableScopes] = useState([]);
  const [scopeValue, setScopeValue] = useState('');
  const [scopeKey, setScopeKey] = useState('');
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');

  useEffect(() => {
    // Fetch available scopes for the dropdown
    const fetchScopes = async () => {
      try {
        const response = await getAllScopes();
        setAvailableScopes(response.data);
      } catch (error) {
        console.error('Error fetching scopes:', error);
        toast.error('Failed to fetch available scopes');
      }
    };

    fetchScopes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (value, fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const addScope = () => {
    if (scopeKey && scopeValue) {
      setFormData({
        ...formData,
        scopes: {
          ...formData.scopes,
          [scopeKey]: scopeValue
        }
      });
      setScopeKey('');
      setScopeValue('');
    }
  };

  const removeScope = (key) => {
    const newScopes = { ...formData.scopes };
    delete newScopes[key];
    setFormData({
      ...formData,
      scopes: newScopes
    });
  };

  const addParam = () => {
    if (paramKey && paramValue) {
      setFormData({
        ...formData,
        params: {
          ...formData.params,
          [paramKey]: paramValue
        }
      });
      setParamKey('');
      setParamValue('');
    }
  };

  const removeParam = (key) => {
    const newParams = { ...formData.params };
    delete newParams[key];
    setFormData({
      ...formData,
      params: newParams
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const controlData = {
        ...formData,
        catalogId
      };
      
      await createControl(controlData);
      toast.success('Control created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating control:', error);
      toast.error('Failed to create control');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Control</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Control name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select name="period" value={formData.period} onValueChange={(value) => handleSelectChange(value, 'period')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Control description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mashupId">Mashup ID</Label>
            <Input
              id="mashupId"
              name="mashupId"
              placeholder="Mashup ID"
              value={formData.mashupId}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Parameters</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Parameter name"
                value={paramKey}
                onChange={(e) => setParamKey(e.target.value)}
              />
              <Input
                placeholder="Parameter value"
                value={paramValue}
                onChange={(e) => setParamValue(e.target.value)}
              />
              <Button type="button" onClick={addParam}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(formData.params).map(([key, value]) => (
                <div key={key} className="flex items-center bg-gray-100 rounded-md p-1">
                  <span className="text-sm">
                    {key}: {value}
                  </span>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 ml-1" 
                    onClick={() => removeParam(key)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scopes</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Scope name"
                value={scopeKey}
                onChange={(e) => setScopeKey(e.target.value)}
              />
              <Input
                placeholder="Scope value"
                value={scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
              />
              <Button type="button" onClick={addScope}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(formData.scopes).map(([key, value]) => (
                <div key={key} className="flex items-center bg-gray-100 rounded-md p-1">
                  <span className="text-sm">
                    {key}: {value}
                  </span>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 ml-1" 
                    onClick={() => removeScope(key)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Control'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
