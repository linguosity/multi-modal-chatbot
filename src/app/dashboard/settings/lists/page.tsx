"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const listsFormSchema = z.object({
  defaultView: z.enum(["grid", "list"], {
    required_error: "Please select a default view",
  }),
  defaultSort: z.enum(["alphabetical", "recent", "created"], {
    required_error: "Please select a default sort order",
  }),
  autoSave: z.boolean().default(true),
  sharingDefault: z.enum(["private", "team", "public"], {
    required_error: "Please select a default sharing option",
  }),
})

type ListsFormValues = z.infer<typeof listsFormSchema>

// Default values can be populated from user lists settings
const defaultValues: Partial<ListsFormValues> = {
  defaultView: "grid",
  defaultSort: "recent",
  autoSave: true,
  sharingDefault: "private",
}

export default function ListsSettingsPage() {
  const form = useForm<ListsFormValues>({
    resolver: zodResolver(listsFormSchema),
    defaultValues,
  })

  function onSubmit(data: ListsFormValues) {
    // Submit form data to your API
    console.log(data)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Word Lists Settings</CardTitle>
          <CardDescription>
            Configure your preferences for the Word Lists app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultView"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Default View</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="grid" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Grid View
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="list" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              List View
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Choose how your word lists will be displayed by default.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="defaultSort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Sort Order</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sort order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="alphabetical">Alphabetical</SelectItem>
                          <SelectItem value="recent">Recently Updated</SelectItem>
                          <SelectItem value="created">Created Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How your lists will be sorted by default.
                      </FormDescription>
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
                      <FormLabel className="text-base">Auto-Save Lists</FormLabel>
                      <FormDescription>
                        Automatically save your word lists while editing
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
                name="sharingDefault"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Default Sharing Option</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="private" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Private (Only me)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="team" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Team (My organization)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="public" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Public (Anyone with link)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Set the default sharing level for new word lists you create.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <Button type="submit">Save List Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}