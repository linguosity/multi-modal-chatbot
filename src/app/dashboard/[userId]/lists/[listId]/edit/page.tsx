'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Save, ArrowLeft, Trash, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWordLists } from '@/components/contexts/wordlists-context';

// Form schema
const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  targetSound: z.string().min(1, 'Target sound is required'),
  wordPosition: z.enum(['initial', 'medial', 'final', 'all'], {
    required_error: 'Word position is required',
  }),
  maxSyllables: z.number().min(1).max(5),
  excludedSounds: z.string().optional(),
  studentId: z.string().optional(),
});

// Mock word list data - same as in page.tsx
const MOCK_WORD_LIST = {
  id: '123',
  title: 'John Smith - /s/ Initial Position',
  targetSound: '/s/',
  wordPosition: 'initial',
  maxSyllables: 2,
  excludedSounds: [],
  studentId: 'student-123',
  createdAt: '2024-03-15',
  updatedAt: '2024-03-18',
  studentName: 'John Smith',
  studentAge: '8',
  realWords: [
    "sun", "sit", "soap", "say", "six", "sand", "saw", "sip", "sell", "sick",
    "safe", "same", "sad", "sail", "salt", "sock", "soft", "soup", "seed", "seat"
  ],
  nonsenseWords: [
    "seb", "sig", "sop", "sut", "sek", "siv", "som", "saf", "sut", "sym"
  ],
  phrases: [
    "six sunny days",
    "sad sick sailor",
    "silver sand castle",
    "soft silk scarf",
    "second summer sunset"
  ],
  sentences: [
    "Sam saw six seals swimming.",
    "Sally sells seashells by the seashore.",
    "The student solved several science problems.",
    "Seven sisters sat silently.",
    "Susan sang songs at the celebration."
  ],
  narrative: `<p>Once upon a time, there was a <mark>silly</mark> <mark>snake</mark> named <mark>Sam</mark>...</p>`
};

export default function EditWordListPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, listId } = params as { userId: string; listId: string };
  
  const [loading, setLoading] = useState(true);
  const [wordList, setWordList] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  
  const { setCurrentWordList } = useWordLists();
  
  // Load word list data
  useEffect(() => {
    const fetchWordList = async () => {
      try {
        // In a real app, you'd fetch from API
        await new Promise(resolve => setTimeout(resolve, 500));
        setWordList(MOCK_WORD_LIST);
        setCurrentWordList(MOCK_WORD_LIST);
      } catch (error) {
        console.error('Error fetching word list:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWordList();
    
    return () => {
      // Cleanup
      setCurrentWordList(null);
    };
  }, [listId, setCurrentWordList]);
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      targetSound: '',
      wordPosition: 'initial',
      maxSyllables: 2,
      excludedSounds: '',
      studentId: '',
    },
    // Values will be populated when wordList is loaded
  });
  
  // Update form when word list data is loaded
  useEffect(() => {
    if (wordList) {
      form.reset({
        title: wordList.title,
        targetSound: wordList.targetSound,
        wordPosition: wordList.wordPosition,
        maxSyllables: wordList.maxSyllables,
        excludedSounds: wordList.excludedSounds?.join(', ') || '',
        studentId: wordList.studentId || '',
      });
    }
  }, [wordList, form]);
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Convert excludedSounds string to array
      const excludedSoundsArray = values.excludedSounds
        ? values.excludedSounds.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      // Prepare payload
      const payload = {
        ...values,
        excludedSounds: excludedSoundsArray,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Updating word list:', payload);
      
      // Mock API call
      // In a real app, you'd make an API request here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to the list view
      router.push(`/dashboard/${userId}/lists/${listId}`);
    } catch (error) {
      console.error('Error updating word list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle regeneration
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setRegenerateDialogOpen(false);
    
    try {
      // Get current form values
      const values = form.getValues();
      
      // Convert excludedSounds string to array
      const excludedSoundsArray = values.excludedSounds
        ? values.excludedSounds.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      // Prepare payload
      const payload = {
        targetSound: values.targetSound,
        wordPosition: values.wordPosition,
        maxSyllables: values.maxSyllables,
        excludedSounds: excludedSoundsArray,
      };
      
      console.log('Regenerating word list with:', payload);
      
      // Mock API call
      // In a real app, you'd make an API request here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message and redirect back to list view
      router.push(`/dashboard/${userId}/lists/${listId}`);
    } catch (error) {
      console.error('Error regenerating word list:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Handle deletion
  const handleDelete = async () => {
    try {
      // In a real app, you'd make an API request here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to the lists page
      router.push(`/dashboard/${userId}/lists`);
    } catch (error) {
      console.error('Error deleting word list:', error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Loading Word List...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Word List</h1>
      </div>
      
      {isRegenerating && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Regenerating word list</AlertTitle>
          <AlertDescription>
            This may take a moment. Please wait while we generate new words, phrases, and sentences...
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Word List Configuration</CardTitle>
          <CardDescription>
            Update your target sound configuration. Note that changing these settings may require regenerating the word list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John's /s/ Initial Word List" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this word list
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Target Sound */}
              <FormField
                control={form.control}
                name="targetSound"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Sound (IPA)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., /s/, /r/, /k/" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the target phoneme in IPA notation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Word Position */}
              <FormField
                control={form.control}
                name="wordPosition"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Word Position</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="initial" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Initial (beginning of word)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="medial" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Medial (middle of word)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="final" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Final (end of word)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="all" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            All positions
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Max Syllables */}
              <FormField
                control={form.control}
                name="maxSyllables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Syllables: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of syllables in generated words
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Excluded Sounds */}
              <FormField
                control={form.control}
                name="excludedSounds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excluded Sounds (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., /z/, /ʃ/, /ʒ/" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of sounds to exclude from generated words
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              {/* Student Selection would go here in a real implementation */}
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Student ID or name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Associate this word list with a specific student
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete this word list and all its content.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="flex gap-2">
                  <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">
                        Regenerate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Regenerate Word List?</DialogTitle>
                        <DialogDescription>
                          This will create new words, phrases, sentences, and narrative based on your current settings. Any existing content will be replaced.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRegenerate}>
                          Regenerate
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}