import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createControl } from '@/services/controls';
import { getAllScopes, createScopeSet } from '@/services/scopes';
import { getAllApiFlows } from '@/services/mashups';
import { PlusCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [availableScopes, setAvailableScopes] = useState([]);
  const [availableMashups, setAvailableMashups] = useState([]);
  const [selectedScope, setSelectedScope] = useState('');
  const [scopeValue, setScopeValue] = useState('');
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');

  useEffect(() => {
    // Fetch available scopes for the dropdown
    const fetchScopes = async () => {
      try {
        const response = await getAllScopes();
        setAvailableScopes(response);
      } catch (error) {
        console.error('Error fetching scopes:', error);
        toast.error('Failed to fetch available scopes');
      }
    };

    // Fetch available mashups for the dropdown
    const fetchMashups = async () => {
      try {
        const response = await getAllApiFlows();
        setAvailableMashups(response.data);
      } catch (error) {
        console.error('Error fetching mashups:', error);
        toast.error('Failed to fetch available mashups');
      }
    };

    fetchScopes();
    fetchMashups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (type === 'date') {
      e.target.blur();
    }
  };

  const handleSelectChange = (value, fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });

    // Si el campo es mashupId, busca la URL del mashup y añádela como parámetro "endpoint"
    if (fieldName === 'mashupId') {
      const selectedMashup = availableMashups.find(mashup => mashup.id === value);
      
      if (selectedMashup && selectedMashup.url) {
        // Agrega o actualiza el parámetro "endpoint" con la URL del mashup
        setFormData(prevData => ({
          ...prevData,
          [fieldName]: value,
          params: {
            ...prevData.params,
            endpoint: selectedMashup.url
          }
        }));
      }
    }
  };

  const addScope = () => {
    if (selectedScope && scopeValue) {
      setFormData({
        ...formData,
        scopes: {
          ...formData.scopes,
          [selectedScope]: scopeValue
        }
      });
      setSelectedScope('');
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
      // First create the control
      const controlData = {
        ...formData,
        catalogId
      };
      
      const createdControl = await createControl(controlData);
      
      // Then create the scope set using the control ID
      if (Object.keys(formData.scopes).length > 0) {
        const scopeSetData = {
          controlId: createdControl.id,
          scopes: formData.scopes
        };
        
        await createScopeSet(scopeSetData);
      }
      
      toast.success('Control created successfully with associated scopes');
      onSuccess();
    } catch (error) {
      console.error('Error creating control and scopes:', error);
      toast.error('Failed to create control and associate scopes');
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
            <Label htmlFor="mashupId">Mashup</Label>
            <Select name="mashupId" value={formData.mashupId} onValueChange={(value) => handleSelectChange(value, 'mashupId')}>
              <SelectTrigger>
                <SelectValue placeholder="Select mashup" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {availableMashups.map((mashup) => (
                  <SelectItem className="hover:cursor-pointer" key={mashup.id} value={mashup.id}>
                    {mashup.label || mashup.name} {mashup.url && `(${mashup.url})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <div className="flex items-center">
                <div
                  onClick={addParam}
                  className="p-1 transition-all cursor-pointer hover:bg-secondary hover:rounded-full"
                >
                  <PlusCircle size="22" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(formData.params).map(([key, value]) => (
                <div key={key} className="flex items-center bg-gray-100 rounded-md">
                  <Badge key={key} variant="outline" className="px-2 py-1">
                    <span>{key}: {value}</span>
                    <div 
                      role="button" 
                      tabIndex="0" 
                      className="flex cursor-pointer ml-1 text-center items-center" 
                      onClick={() => removeParam(key)}
                    >
                      <X size="14" />
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scopes</Label>
            <div className="flex space-x-2">
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {availableScopes.map((scope) => (
                    <SelectItem className="hover:cursor-pointer" key={scope.id} value={scope.name}>
                      {scope.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Scope value"
                value={scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
              />
              <div className="flex items-center">
                <div
                  onClick={addScope}
                  className="p-1 transition-all cursor-pointer hover:bg-secondary hover:rounded-full"
                >
                  <PlusCircle size="22" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(formData.scopes).map(([key, value]) => (
                <div key={key} className="flex items-center bg-gray-100 rounded-md">
                  <Badge key={key} variant="outline" className="px-2 py-1">
                    <span>{key}: {value}</span>
                    <div 
                      role="button" 
                      tabIndex="0" 
                      className="flex cursor-pointer ml-1 text-center items-center" 
                      onClick={() => removeScope(key)}
                    >
                      <X size="14" />
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              type="submit"
            >
              {loading ? 'Creating...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
