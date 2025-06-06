"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const storiesFormSchema = z.object({
  defaultNarrativeStyle: z.string({
    required_error: "Please select a default narrative style.",
  }),
  complexityLevel: z.number().min(1).max(5),
  targetAge: z.string({
    required_error: "Please select a target age group.",
  }),
  autoSave: z.boolean().default(true),
  includeVisuals: z.boolean().default(true),
})

type StoriesFormValues = z.infer<typeof storiesFormSchema>

// Default values can be populated from user stories settings
const defaultValues: Partial<StoriesFormValues> = {
  defaultNarrativeStyle: "descriptive",
  complexityLevel: 3,
  targetAge: "elementary",
  autoSave: true,
  includeVisuals: true,
}

export default function StoriesSettingsPage() {
  const form = useForm<StoriesFormValues>({
    resolver: zodResolver(storiesFormSchema),
    defaultValues,
  })

  function onSubmit(data: StoriesFormValues) {
    // Submit form data to your API
    console.log(data)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stories Settings</CardTitle>
          <CardDescription>
            Configure your preferences for the Stories app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultNarrativeStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Narrative Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a narrative style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="descriptive">Descriptive</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="actionOriented">Action-Oriented</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This style will be applied by default for new stories.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Age Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target age" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preschool">Preschool (3-5)</SelectItem>
                          <SelectItem value="elementary">Elementary (6-10)</SelectItem>
                          <SelectItem value="middleSchool">Middle School (11-13)</SelectItem>
                          <SelectItem value="highSchool">High School (14-18)</SelectItem>
                          <SelectItem value="adult">Adult</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Default target age group for your stories.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="complexityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complexity Level: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the default complexity level for your stories (1-5).
                      Higher values generate more complex narrative structures.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="autoSave"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Save Stories</FormLabel>
                        <FormDescription>
                          Automatically save your stories while editing
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includeVisuals"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Visuals</FormLabel>
                        <FormDescription>
                          Automatically include visual suggestions with generated stories
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit">Save Story Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}