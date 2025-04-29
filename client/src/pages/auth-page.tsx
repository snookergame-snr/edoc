import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "ต้องกรอกชื่อผู้ใช้"),
  password: z.string().min(1, "ต้องกรอกรหัสผ่าน"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Register schema - extending the insertUserSchema
const registerSchema = insertUserSchema.extend({
  passwordConfirm: z.string().min(1, "ต้องยืนยันรหัสผ่าน"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["passwordConfirm"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      displayName: "",
      department: "",
      role: "staff",
      email: "",
      profileImage: "",
    },
  });

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Remove passwordConfirm before sending to API
    const { passwordConfirm, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              ระบบจัดการเอกสารโรงพยาบาลเอกชล
            </h1>
            <p className="text-gray-500 mt-2">
              เข้าสู่ระบบเพื่อจัดการเอกสารของคุณ
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">เข้าสู่ระบบ</TabsTrigger>
              <TabsTrigger value="register">ลงทะเบียน</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>เข้าสู่ระบบ</CardTitle>
                  <CardDescription>
                    กรอกข้อมูลบัญชีของคุณเพื่อเข้าสู่ระบบ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อผู้ใช้</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>รหัสผ่าน</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        เข้าสู่ระบบ
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-gray-500">
                    ยังไม่มีบัญชี?{" "}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => setActiveTab("register")}
                    >
                      ลงทะเบียน
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>ลงทะเบียน</CardTitle>
                  <CardDescription>
                    สร้างบัญชีใหม่เพื่อใช้งานระบบ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อผู้ใช้</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อ-นามสกุล</FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อ นามสกุล" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>แผนก</FormLabel>
                            <FormControl>
                              <Input placeholder="แผนก" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>อีเมล</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>บทบาท</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกบทบาท" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                                <SelectItem value="manager">ผู้จัดการ</SelectItem>
                                <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>รหัสผ่าน</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="passwordConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        ลงทะเบียน
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-gray-500">
                    มีบัญชีอยู่แล้ว?{" "}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => setActiveTab("login")}
                    >
                      เข้าสู่ระบบ
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-500 p-12">
        <div className="h-full flex flex-col justify-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            ระบบจัดการเอกสารโรงพยาบาลเอกชล
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">ศูนย์ดาวน์โหลดเอกสาร</h3>
                <p className="text-white text-opacity-80">
                  จัดเก็บและดาวน์โหลดแบบฟอร์ม เอกสารทางการ และเทมเพลตต่างๆ
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">ระบบหมุนเวียนเอกสาร</h3>
                <p className="text-white text-opacity-80">
                  สร้างขั้นตอนการอนุมัติเอกสาร ติดตามสถานะ และรับการแจ้งเตือน
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 15V9a8 8 0 0 1 16 0v6" />
                  <circle cx="11" cy="11" r="1" />
                  <circle cx="11" cy="15" r="1" />
                  <circle cx="7" cy="13" r="1" />
                  <circle cx="15" cy="13" r="1" />
                  <path d="M3 15h18" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">พื้นที่จัดเก็บส่วนตัว</h3>
                <p className="text-white text-opacity-80">
                  จัดเก็บไฟล์ส่วนตัวและแผนก จัดระเบียบโฟลเดอร์ และแชร์กับผู้อื่น
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}