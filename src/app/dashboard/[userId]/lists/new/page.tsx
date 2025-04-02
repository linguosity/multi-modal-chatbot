'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

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

export default function NewWordListPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  });

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
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Creating new word list:', payload);
      
      // Mock API call
      // In a real app, you'd make an API request here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to the new list (using a mock ID for now)
      router.push(`/dashboard/${userId}/lists/new-list-123`);
    } catch (error) {
      console.error('Error creating word list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Create New Word List</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Word List Configuration</CardTitle>
          <CardDescription>
            Configure your target sound, position, and constraints for the word list generation.
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
                        defaultValue={field.value}
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
                        defaultValue={[field.value]}
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
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Word List
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}