'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import {
  AccountCircle,
  Logout,
  Dashboard,
  People,
  Assessment
} from '@mui/icons-material'
import { Alert } from '@mui/material'
import { Toaster } from 'react-hot-toast'

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

interface User {
  username: string
  role: string
  email: string
  full_name: string
}

interface Lead {
  id: number
  practice_name: string
  owner_name: string
  specialty: string
  priority: string
  status: string
  score: number
  assigned_user_id?: number
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      // Only fetch leads if authentication was successful
      if (localStorage.getItem('authToken')) {
        fetchLeads()
      } else {
        // If no token after auth check, redirect to login
        setTimeout(() => {
          if (!localStorage.getItem('authToken')) {
            window.location.replace('/login')
          }
        }, 100)
      }
    }
    initAuth()

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading && !user) {
        console.warn('Loading timeout reached, redirecting to login')
        window.location.replace('/login')
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('No token found, redirecting to login')
        // Use replace to prevent back button issues
        window.location.replace('/login')
        return
      }

      console.log('Token found, checking authentication...')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://3.83.217.40/api/v1'
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const responseData = await response.json()
        const userData = responseData.data || responseData
        console.log('Authentication successful:', userData)
        setUser(userData)
        setLoading(false)
      } else {
        console.error('Auth check failed with status:', response.status)
        localStorage.removeItem('authToken')
        window.location.replace('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('authToken')
      window.location.replace('/login')
    }
  }

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://3.83.217.40/api/v1'
      const response = await fetch(`${API_BASE_URL}/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      } else if (response.status === 400 && response.statusText.includes('numeric string')) {
        // Backend has a bug with ParseIntPipe, show mock data for demo
        console.warn('Backend API has validation issues, showing demo data')
        setError('Using demo data - backend API needs fixing')
        setLeads([
          {
            id: 1,
            practice_name: 'Demo Medical Practice',
            owner_name: 'Dr. Smith',
            specialty: 'Cardiology',
            priority: 'high',
            status: 'contacted',
            score: 85
          }
        ])
      } else {
        console.error('Failed to fetch leads:', response.status, response.statusText)
        setError(`API Error: ${response.status} ${response.statusText}`)
        // Set empty leads array for graceful degradation
        setLeads([])
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
      setError('Network error - unable to connect to API')
      // Set empty leads array for graceful degradation
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'success'
      case 'contacted': return 'info'
      case 'qualified': return 'secondary'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography>Loading...</Typography>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />

      <AppBar position="static">
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VantagePoint CRM
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {user.full_name}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Leads
                </Typography>
                <Typography variant="h4">
                  {leads.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  High Priority
                </Typography>
                <Typography variant="h4" color="error">
                  {leads.filter(l => l.priority === 'high').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Leads
                </Typography>
                <Typography variant="h4" color="primary">
                  {leads.filter(l => l.status === 'contacted' || l.status === 'qualified').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sold
                </Typography>
                <Typography variant="h4" color="success">
                  {leads.filter(l => l.status === 'sold').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Leads Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Leads
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {leads.slice(0, 10).map((lead) => (
                    <Box
                      key={lead.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: '1px solid #eee',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Avatar sx={{ mr: 2 }}>
                        {lead.practice_name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {lead.practice_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {lead.owner_name} • {lead.specialty}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={lead.priority}
                          color={getPriorityColor(lead.priority)}
                          size="small"
                        />
                        <Chip
                          label={lead.status}
                          color={getStatusColor(lead.status)}
                          size="small"
                        />
                        <Chip
                          label={`Score: ${lead.score}`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  )
}
