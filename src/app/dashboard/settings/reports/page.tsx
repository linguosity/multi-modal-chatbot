"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const reportsFormSchema = z.object({
  defaultTemplate: z.string({
    required_error: "Please select a default template.",
  }),
  aiProvider: z.string({
    required_error: "Please select an AI provider.",
  }),
  autoSave: z.boolean().default(true),
  commonPhrases: z.string().max(2000, {
    message: "Common phrases must not be longer than 2000 characters.",
  }).optional(),
})

type ReportsFormValues = z.infer<typeof reportsFormSchema>

// Default values can be populated from user reports settings
const defaultValues: Partial<ReportsFormValues> = {
  defaultTemplate: "standard",
  aiProvider: "claude",
  autoSave: true,
  commonPhrases: "",
}

export default function ReportsSettingsPage() {
  const form = useForm<ReportsFormValues>({
    resolver: zodResolver(reportsFormSchema),
    defaultValues,
  })

  function onSubmit(data: ReportsFormValues) {
    // Submit form data to your API
    console.log(data)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports Settings</CardTitle>
          <CardDescription>
            Configure your preferences for the Reports app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard Report</SelectItem>
                          <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                          <SelectItem value="brief">Brief Summary</SelectItem>
                          <SelectItem value="custom">Custom Template</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This template will be used by default for new reports.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="aiProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select AI provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="claude">Claude</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="local">Local Model</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select your preferred AI provider for generating reports.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="autoSave"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-Save</FormLabel>
                      <FormDescription>
                        Automatically save your reports while editing
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
              
              <Separator />
              
              <FormField
                control={form.control}
                name="commonPhrases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Common Phrases</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter commonly used phrases, one per line"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add frequently used phrases to quickly insert them into your reports.
                      Each line will be treated as a separate phrase.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit">Save Report Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}